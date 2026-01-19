import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { ImageGenAdapter } from '../services/ImageGenAdapter';
import { StorageAdapter } from '../services/StorageAdapter';
import { SimilarityService } from '../services/SimilarityService';
import { PromptMatrixEngine } from '../services/promptMatrix/PromptMatrixEngine';
import { SafetyRewrite } from '../services/promptMatrix/SafetyRewrite';
import { PromptComposer } from '../services/promptMatrix/PromptComposer';
import { scoreMatrix } from '../services/promptMatrix/scoring';
import { emitTelemetryEvent } from '../services/promptMatrix/TelemetryService';
import { MatrixTelemetry } from '../services/telemetry/MatrixTelemetry';
import type { MatrixFlavor } from '../services/promptMatrix/types';
import { config } from '../config';
import { ALLOWED_TAGS, BASE_IMAGES } from '../constants';
import type { ForgeResponse, ForgeError, ReleaseResponse } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { z } from 'zod';

const baseImagePattern = /\/horny_base\/base-.*\.(png|jpe?g|webp|gif)$/i;

const forgeRequestSchema = z.object({
  base_id: z.string().optional(),
  base_image: z.string().optional(),
  preset: z.enum(['HORNY_CORE_SKETCH', 'HORNY_META_SCENE', 'HORNY_CHAOS_VARIATION']),
  user_input: z.string().min(1).max(240).optional(),
  user_prompt: z.string().min(1).max(240).optional(),
  energy: z.number().min(1).max(5).optional(),
  flavor: z.string().optional(),
  template_key: z.string().optional(),
  size: z.enum(['1024x1024']).optional(),
  seed: z.string().optional(),
  debug: z.boolean().optional(),
  preview_request_id: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.user_input && !data.user_prompt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'user_input or user_prompt is required',
      path: ['user_input'],
    });
  }
  if (!data.base_id && !data.base_image) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'base_id or base_image is required',
      path: ['base_id'],
    });
  }

  if (data.base_image && !baseImagePattern.test(data.base_image)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'base_image must be a horny_base/base-* asset',
      path: ['base_image'],
    });
  }
});

const releaseRequestSchema = z.object({
  generation_id: z.string().min(1),
  caption: z.string().max(140).optional(),
  tags: z.array(z.string()).min(1).max(3),
  remix_of: z.string().optional(),
  release_request_id: z.string().optional(),
});

export class ForgeController {
  private imageGen: ImageGenAdapter;
  private storage: StorageAdapter;
  private supabase;
  private similarity: SimilarityService;
  private matrixEngine: PromptMatrixEngine;
  private safetyRewrite: SafetyRewrite;
  private promptComposer: PromptComposer;
  private telemetry: MatrixTelemetry;

  constructor() {
    this.imageGen = new ImageGenAdapter();
    this.storage = new StorageAdapter();
    this.supabase = createClient<Database>(config.supabase.url, config.supabase.serviceRoleKey);
    this.similarity = new SimilarityService();
    this.matrixEngine = new PromptMatrixEngine();
    this.safetyRewrite = new SafetyRewrite();
    this.promptComposer = new PromptComposer();
    this.telemetry = new MatrixTelemetry();
  }

  private getForgeDailyLimit(level: number): number {
    if (level >= 8) return 25;
    if (level >= 5) return 15;
    if (level >= 3) return 10;
    return 5;
  }

  private getReleaseDailyLimit(level: number): number {
    if (level >= 8) return 10;
    if (level >= 5) return 7;
    return 5;
  }

  private async getUserLevel(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('user_stats')
      .select('user_id, level')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error('Failed to load user stats');
    }

    if (!data) {
      // @ts-expect-error - Supabase table types are not fully generated
      const { error: insertError } = await this.supabase.from('user_stats').insert({
        user_id: userId,
        xp_total: 0,
        level: 1,
        streak_days: 0,
        last_active_at: null,
      });
      if (insertError) throw new Error('Failed to create user stats');
      return 1;
    }

    // @ts-expect-error - Supabase table types are not fully generated
    return data.level ?? 1;
  }

  private async checkQuota(params: {
    userId: string;
    key: string;
    limit: number;
  }): Promise<{ allowed: boolean; remaining: number }> {
    // @ts-expect-error - Supabase RPC types are not fully generated
    const { data, error } = await this.supabase.rpc('check_and_consume_quota', {
      p_user_id: params.userId,
      p_key: params.key,
      p_limit: params.limit,
    });

    if (error) {
      throw new Error('Failed to check quota');
    }

    return {
      // @ts-expect-error - Supabase RPC types are not fully generated
      allowed: !!data?.allowed,
      // @ts-expect-error - Supabase RPC types are not fully generated
      remaining: typeof data?.remaining === 'number' ? data.remaining : 0,
    };
  }

  private ensureUnlocked(level: number, baseId: string, preset: string) {
    const baseUnlocks: Record<string, number> = {
      'base-01': 1,
      'base-02': 2,
      'base-03': 3,
      'base-04': 5,
    };

    const presetUnlocks: Record<string, number> = {
      HORNY_CORE_SKETCH: 1,
      HORNY_META_SCENE: 2,
      HORNY_CHAOS_VARIATION: 4,
    };

    const baseRequired = baseUnlocks[baseId] ?? 1;
    const presetRequired = presetUnlocks[preset] ?? 1;

    if (level < baseRequired || level < presetRequired) {
      throw Object.assign(new Error('locked'), {
        status: 403,
        code: 'LOCKED',
        required_level: Math.max(baseRequired, presetRequired),
      });
    }
  }

  /**
   * POST /api/forge
   */
  async forge(req: AuthenticatedRequest, res: Response<ForgeResponse | ForgeError>): Promise<void> {
    const startTime = Date.now();

    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
        return;
      }

      // Validate request
      const validationResult = forgeRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Invalid input',
          code: 'INVALID_INPUT',
        });
        return;
      }

      const {
        base_id,
        base_image,
        preset,
        user_input,
        user_prompt,
        energy,
        flavor,
        template_key,
        size = '1024x1024',
        debug = false,
        preview_request_id,
      } = validationResult.data;
      const resolvedUserInput = user_input ?? user_prompt ?? '';
      const previewRequestId = preview_request_id ?? randomUUID();

      let resolvedBaseId = base_id;
      const resolvedBaseImage = base_image;

      if (resolvedBaseImage) {
        const fileName = resolvedBaseImage.split('/').pop();
        resolvedBaseId = fileName ? fileName.replace(/\.[^.]+$/, '') : resolvedBaseId;
      }

      if (!resolvedBaseId) {
        res.status(400).json({
          error: 'Invalid input',
          code: 'INVALID_INPUT',
        });
        return;
      }

      const userLevel = await this.getUserLevel(req.userId);
      this.ensureUnlocked(userLevel, resolvedBaseId, preset);

      const quota = await this.checkQuota({
        userId: req.userId,
        key: 'forge_requests',
        limit: this.getForgeDailyLimit(userLevel),
      });
      if (!quota.allowed) {
        res.status(429).json({
          error: 'Daily forge limit reached',
          code: 'FORGE_LIMIT',
          remaining: quota.remaining,
        });
        return;
      }

      const safetyRewrite = this.safetyRewrite.rewrite(resolvedUserInput);
      const { energy: clampedEnergyValue, clamped: energyClamped } = this.matrixEngine.clampEnergy(userLevel, energy);
      let matrixSelection;
      let fallbackUsed = false;

      try {
        matrixSelection = this.matrixEngine.select({
          userPrompt: safetyRewrite.rewrittenPrompt,
          nudges: {
            energy: clampedEnergyValue,
            flavor: flavor as MatrixFlavor | undefined,
            templateKey: template_key ?? resolvedBaseId,
          },
          flags: safetyRewrite.flags,
        });
      } catch (error: unknown) {
        console.warn('Matrix selection failed, falling back to safe defaults:', error);
        matrixSelection = this.matrixEngine.selectSafeDefault(safetyRewrite.rewrittenPrompt);
        fallbackUsed = true;
      }

      const promptPack = this.promptComposer.compose({
        rewrittenPrompt: safetyRewrite.rewrittenPrompt,
        selection: matrixSelection,
        baseId: resolvedBaseId,
        preset,
      });
      const composerFallbackUsed = Boolean(promptPack.meta?.fallback_used);
      const fallbackStage = composerFallbackUsed ? 'composer' : fallbackUsed ? 'matrix' : undefined;

      const usedGuardrails = [
        ...new Set([
          ...safetyRewrite.usedGuardrails,
          ...promptPack.guardrailFlags,
          ...(Array.isArray(promptPack.meta?.used_guardrails) ? promptPack.meta.used_guardrails : []),
          ...(fallbackUsed ? ['MATRIX_FALLBACK'] : []),
          ...(energyClamped ? ['ENERGY_CLAMP'] : []),
        ]),
      ];
      const fallbackUsedCombined = fallbackUsed || composerFallbackUsed;

      if (safetyRewrite.flags.includes('empty')) {
        res.status(400).json({
          error: 'Input is empty or unusable',
          code: 'PROMPT_REJECTED',
        });
        return;
      }

      const scores = scoreMatrix({
        selection: matrixSelection,
        flags: safetyRewrite.flags,
        rewrittenPrompt: safetyRewrite.rewrittenPrompt,
      });

      // Generate image
      let imageBytes: Buffer;
      let modelMeta: { model: string; size: string };
      try {
        const imageResult = await this.imageGen.generate({
          baseId: resolvedBaseId,
          baseImagePath: resolvedBaseImage,
          finalPrompt: promptPack.prompt,
          size,
        });
        imageBytes = imageResult.imageBytes;
        modelMeta = imageResult.modelMeta;
      } catch (error: unknown) {
        console.error('Image generation failed:', error);
        const errorObj = error && typeof error === 'object' ? (error as { code?: string; status?: number }) : null;
        if (errorObj?.code === 'GEN_UNAVAILABLE') {
          res.status(503).json({
            error: 'Image generation unavailable',
            code: 'GEN_UNAVAILABLE',
          });
          return;
        }
        res.status(500).json({
          error: 'Artifact unstable. Retry.',
          code: 'GEN_FAIL',
        });
        return;
      }

      // Store preview
      let previewResult;
      try {
        previewResult = await this.storage.storePreview(imageBytes);
      } catch (error: unknown) {
        console.error('Preview storage failed:', error);
        res.status(500).json({
          error: 'Failed to store preview',
          code: 'STORAGE_FAIL',
        });
        return;
      }

      // @ts-expect-error - Supabase table types are not fully generated
      const { error: previewDbError } = await this.supabase.from('forge_previews').insert({
        generation_id: previewResult.generationId,
        user_id: req.userId,
        base_id: resolvedBaseId,
        preset,
        template_key: promptPack.meta.template_key ?? resolvedBaseId,
        matrix_meta: {
          ...promptPack.meta,
          flags: safetyRewrite.flags,
          used_guardrails: usedGuardrails,
          fallback_used: fallbackUsedCombined,
          fallback_stage: fallbackStage,
          energy_clamped: energyClamped,
        },
        scores,
      });

      if (previewDbError) {
        console.error('Preview safety insert failed:', previewDbError);
        res.status(500).json({
          error: 'Failed to record safety checks',
          code: 'DB_FAIL',
        });
        return;
      }

      // Build response
      const response: ForgeResponse = {
        generation_id: previewResult.generationId,
        base_id: resolvedBaseId,
        preset,
        sanitized_input: safetyRewrite.rewrittenPrompt,
        image_url: previewResult.previewUrl,
        created_at: new Date().toISOString(),
        matrix_meta: {
          ...promptPack.meta,
          flags: safetyRewrite.flags,
          used_guardrails: usedGuardrails,
          fallback_used: fallbackUsedCombined,
          fallback_stage: fallbackStage,
          energy_clamped: energyClamped,
        },
        scores,
        meta: {
          expires_in_seconds: config.forge.previewTtlSeconds,
          model: modelMeta.model,
          size: modelMeta.size,
        },
        preview_request_id: previewRequestId,
      };

      // Include debug info if requested or in development
      if (debug || config.nodeEnv === 'development') {
        response.debug = {
          final_prompt: promptPack.prompt,
        };
      }

      // Log telemetry
      const latency = Date.now() - startTime;
      console.log(`[FORGE] generation_id=${previewResult.generationId}, preset=${preset}, base_id=${resolvedBaseId}, latency=${latency}ms`);
      const matrixMeta = response.matrix_meta ?? {};
      const previewTelemetryPayload = {
        meme_preview_id: previewResult.generationId,
        user_id: req.userId,
        schema_version: matrixMeta.schema_version ?? null,
        axes: {
          intent: matrixMeta.intent ?? null,
          energy: matrixMeta.energy ?? null,
          flavor: matrixMeta.flavor ?? null,
          pattern: matrixMeta.pattern ?? null,
          template_key: matrixMeta.template_key ?? null,
        },
        scores,
        flags: {
          fallback_used: matrixMeta.fallback_used ?? false,
          energy_clamped: matrixMeta.energy_clamped ?? false,
        },
      };
      const previewEmitted = emitTelemetryEvent('matrix_preview_created', previewTelemetryPayload, previewRequestId);
      if (previewEmitted) {
        this.telemetry
          .record({
            event_type: 'matrix_preview_created',
            user_id: req.userId,
            matrix_meta: response.matrix_meta ?? null,
            scores,
          })
          .catch((error: unknown) => console.warn('Failed to record matrix telemetry:', error));
      }
      if (fallbackUsedCombined) {
        this.telemetry
          .record({
            event_type: 'matrix_fallback_used',
            user_id: req.userId,
            matrix_meta: response.matrix_meta ?? null,
            scores,
          })
          .catch((error: unknown) => console.warn('Failed to record matrix fallback telemetry:', error));
      }
      if (usedGuardrails.some((flag) => flag !== 'NO_GUARDRAIL')) {
        this.telemetry
          .record({
            event_type: 'matrix_guardrail_applied',
            user_id: req.userId,
            matrix_meta: response.matrix_meta ?? null,
            scores,
          })
          .catch((error: unknown) => console.warn('Failed to record guardrail telemetry:', error));
      }

      res.status(200).json(response);
    } catch (error: unknown) {
      console.error('Forge error:', error);
      res.status(500).json({
        error: 'Artifact unstable. Retry.',
        code: 'GEN_FAIL',
      });
    }
  }

  /**
   * POST /api/forge/release
   */
  async release(req: AuthenticatedRequest, res: Response<ReleaseResponse | ForgeError>): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      // Validate request
      const validationResult = releaseRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Invalid input',
          code: 'INVALID_INPUT',
        });
        return;
      }

      const { generation_id, caption, tags, remix_of, release_request_id } = validationResult.data;
      const releaseRequestId = release_request_id ?? `${generation_id}:release`;

      const userLevel = await this.getUserLevel(req.userId);
      const quota = await this.checkQuota({
        userId: req.userId,
        key: 'release_requests',
        limit: this.getReleaseDailyLimit(userLevel),
      });
      if (!quota.allowed) {
        res.status(429).json({
          error: 'Daily release limit reached',
          code: 'RELEASE_LIMIT',
          remaining: quota.remaining,
        });
        return;
      }

      const normalizedTags = tags.map((tag) => tag.trim());
      const invalidTags = normalizedTags.filter((tag) => !ALLOWED_TAGS.includes(tag as typeof ALLOWED_TAGS[number]));
      if (invalidTags.length > 0) {
        res.status(400).json({
          error: 'invalid_tags',
          code: 'INVALID_INPUT',
        });
        return;
      }

      // Retrieve preview bytes
      let previewBytes: Buffer;
      try {
        previewBytes = await this.storage.getPreviewBytes(generation_id);
      } catch (error: unknown) {
        res.status(404).json({
          error: 'Generation not found or expired',
          code: 'NOT_FOUND',
        });
        return;
      }

      const { data: previewRecordRaw, error: previewRecordError } = await this.supabase
        .from('forge_previews')
        .select('matrix_meta, scores, template_key, base_id')
        .eq('generation_id', generation_id)
        .maybeSingle();
      
      const previewRecord = previewRecordRaw as any;

      if (previewRecordError) {
        console.error('Preview lookup failed:', previewRecordError);
        res.status(500).json({
          error: 'Failed to verify safety checks',
          code: 'DB_FAIL',
        });
        return;
      }

      if (!previewRecord) {
        res.status(404).json({
          error: 'Generation not found or expired',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Similarity check compares output to base images (not content moderation).
      const similarityResult = await this.similarity.compareToBase(previewBytes);
      // safety_checked_at tracks similarity check timing for release gating.
      const safetyCheckedAt = new Date().toISOString();

      const { error: previewUpdateError } = await this.supabase
        .from('forge_previews')
        // @ts-expect-error - Supabase table types are not fully generated
        .update({
          brand_similarity: similarityResult.similarity,
          base_match_id: similarityResult.baseMatchId,
          safety_checked_at: safetyCheckedAt,
        })
        .eq('generation_id', generation_id);

      if (previewUpdateError) {
        console.error('Preview similarity update failed:', previewUpdateError);
        res.status(500).json({
          error: 'Failed to record similarity checks',
          code: 'DB_FAIL',
        });
        return;
      }

      if (similarityResult.similarity < config.forge.brandSimilarityThreshold) {
        res.status(403).json({
          error: 'off_brand',
          code: 'OFF_BRAND',
          brand_similarity: similarityResult.similarity,
          base_match_id: similarityResult.baseMatchId,
        });
        return;
      }

      // Release to permanent storage
      let releaseResult;
      try {
        releaseResult = await this.storage.releaseArtifact({
          generationId: generation_id,
          imageBytes: previewBytes,
          userId: req.userId,
        });
      } catch (error: unknown) {
        console.error('Release storage failed:', error);
        res.status(500).json({
          error: 'Failed to release artifact',
          code: 'STORAGE_FAIL',
        });
        return;
      }

      // Insert artifact into database
      const { data: artifact, error: dbError } = await this.supabase
        .from('artifacts')
        // @ts-expect-error - Supabase table types are not fully generated
        .insert({
          id: releaseResult.artifactId,
          image_url: releaseResult.imageUrl,
          caption: caption || 'Untitled Artifact',
          tags: normalizedTags,
          author_id: req.userId,
          author_handle: req.userHandle || null,
          author_avatar: req.userAvatar || null,
          remix_of: remix_of ?? null,
          template_key: previewRecord?.template_key ?? previewRecord?.base_id ?? null,
          matrix_meta: previewRecord?.matrix_meta ?? null,
          scores: previewRecord?.scores ?? null,
          brand_similarity: similarityResult.similarity,
          base_match_id: similarityResult.baseMatchId,
          safety_checked_at: safetyCheckedAt,
        })
        .select()
        .single();

      if (dbError || !artifact) {
        console.error('DB insert failed:', dbError);
        res.status(500).json({
          error: 'Failed to create artifact',
          code: 'DB_FAIL',
        });
        return;
      }

      const response: ReleaseResponse = {
        // @ts-expect-error - Supabase table types are not fully generated
        artifact_id: artifact.id,
        image_url: releaseResult.imageUrl,
        // @ts-expect-error - Supabase table types are not fully generated
        redirect_url: `/archives/${artifact.id}`,
      };

      const releaseMatrixMeta = previewRecord?.matrix_meta ?? {};
      const releaseScores = previewRecord?.scores ?? null;
      const releaseTelemetryPayload = {
        meme_id: releaseResult.artifactId,
        user_id: req.userId,
        schema_version: releaseMatrixMeta.schema_version ?? null,
        axes: {
          intent: releaseMatrixMeta.intent ?? null,
          energy: releaseMatrixMeta.energy ?? null,
          flavor: releaseMatrixMeta.flavor ?? null,
          pattern: releaseMatrixMeta.pattern ?? null,
          template_key: releaseMatrixMeta.template_key ?? null,
        },
        scores: releaseScores,
        flags: {
          fallback_used: releaseMatrixMeta.fallback_used ?? false,
          energy_clamped: releaseMatrixMeta.energy_clamped ?? false,
        },
      };
      const releaseEmitted = emitTelemetryEvent('matrix_release_created', releaseTelemetryPayload, releaseRequestId);
      if (releaseEmitted) {
        this.telemetry
          .record({
            event_type: 'matrix_release_created',
            user_id: req.userId,
            meme_id: releaseResult.artifactId,
            matrix_meta: previewRecord?.matrix_meta ?? null,
            scores: releaseScores,
          })
          .catch((error: unknown) => console.warn('Failed to record matrix telemetry:', error));
      }

      res.status(200).json(response);
    } catch (error: unknown) {
      console.error('Release error:', error);
      res.status(500).json({
        error: 'Failed to release artifact',
        code: 'STORAGE_FAIL',
      });
    }
  }
}
