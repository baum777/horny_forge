import type { Request, Response } from 'express';
import { PromptEngine } from '../services/PromptEngine';
import { ImageGenAdapter } from '../services/ImageGenAdapter';
import { StorageAdapter } from '../services/StorageAdapter';
import { ModerationService } from '../services/ModerationService';
import { SimilarityService } from '../services/SimilarityService';
import { config } from '../config';
import type { ForgeResponse, ForgeError, ReleaseResponse } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const forgeRequestSchema = z.object({
  base_id: z.enum(['base-01', 'base-02', 'base-03', 'base-04']),
  preset: z.enum(['HORNY_CORE_SKETCH', 'HORNY_META_SCENE', 'HORNY_CHAOS_VARIATION']),
  user_input: z.string().min(1).max(240),
  size: z.enum(['1024x1024']).optional(),
  seed: z.string().optional(),
  debug: z.boolean().optional(),
});

const releaseRequestSchema = z.object({
  generation_id: z.string().min(1),
  caption: z.string().max(140).optional(),
  tags: z.array(z.string()).min(1).max(3),
});

export class ForgeController {
  private imageGen: ImageGenAdapter;
  private storage: StorageAdapter;
  private supabase;
  private moderation: ModerationService;
  private similarity: SimilarityService;

  constructor() {
    this.imageGen = new ImageGenAdapter();
    this.storage = new StorageAdapter();
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    this.moderation = new ModerationService();
    this.similarity = new SimilarityService();
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

    return data.level ?? 1;
  }

  private async checkQuota(params: {
    userId: string;
    key: string;
    limit: number;
  }): Promise<{ allowed: boolean; remaining: number }> {
    const { data, error } = await this.supabase.rpc('check_and_consume_quota', {
      p_user_id: params.userId,
      p_key: params.key,
      p_limit: params.limit,
    });

    if (error) {
      throw new Error('Failed to check quota');
    }

    return {
      allowed: !!data?.allowed,
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

      const { base_id, preset, user_input, size = '1024x1024', debug = false } = validationResult.data;

      const userLevel = await this.getUserLevel(req.userId);
      this.ensureUnlocked(userLevel, base_id, preset);

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

      // Process prompt
      const promptResult = PromptEngine.process({
        preset,
        userInput: user_input,
        baseId: base_id,
      });

      // Check if prompt was rejected
      if (promptResult.safety?.status === 'rejected') {
        res.status(400).json({
          error: 'Input contains blocked content',
          code: 'PROMPT_REJECTED',
        });
        return;
      }

      const moderationResult = await this.moderation.moderateText([user_input, promptResult.final_prompt]);
      if (moderationResult.status === 'fail') {
        res.status(400).json({
          error: 'unsafe_prompt',
          code: 'UNSAFE_PROMPT',
        });
        return;
      }

      // Generate image
      let imageBytes: Buffer;
      let modelMeta: { model: string; size: string };
      try {
        const imageResult = await this.imageGen.generate({
          baseId: base_id,
          finalPrompt: promptResult.final_prompt,
          size,
        });
        imageBytes = imageResult.imageBytes;
        modelMeta = imageResult.modelMeta;
      } catch (error: any) {
        console.error('Image generation failed:', error);
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
      } catch (error: any) {
        console.error('Preview storage failed:', error);
        res.status(500).json({
          error: 'Failed to store preview',
          code: 'STORAGE_FAIL',
        });
        return;
      }

      const safetyCheckedAt = new Date().toISOString();
      const { error: previewDbError } = await this.supabase.from('forge_previews').insert({
        generation_id: previewResult.generationId,
        user_id: req.userId,
        base_id,
        preset,
        moderation_status: moderationResult.status,
        moderation_reasons: moderationResult.reasons,
        safety_checked_at: safetyCheckedAt,
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
        base_id,
        preset,
        sanitized_input: promptResult.sanitized_input,
        image_url: previewResult.previewUrl,
        created_at: new Date().toISOString(),
        meta: {
          expires_in_seconds: config.forge.previewTtlSeconds,
          model: modelMeta.model,
          size: modelMeta.size,
        },
      };

      // Include debug info if requested or in development
      if (debug || config.nodeEnv === 'development') {
        response.debug = {
          final_prompt: promptResult.final_prompt,
        };
      }

      // Log telemetry
      const latency = Date.now() - startTime;
      console.log(`[FORGE] generation_id=${previewResult.generationId}, preset=${preset}, base_id=${base_id}, latency=${latency}ms`);

      res.status(200).json(response);
    } catch (error: any) {
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

      const { generation_id, caption, tags } = validationResult.data;

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

      // Validate tags (should be from allowed list, but for MVP we'll just check format)
      // TODO: Add allowed tags validation

      // Retrieve preview bytes
      let previewBytes: Buffer;
      try {
        previewBytes = await this.storage.getPreviewBytes(generation_id);
      } catch (error: any) {
        res.status(404).json({
          error: 'Generation not found or expired',
          code: 'NOT_FOUND',
        });
        return;
      }

      const { data: previewRecord, error: previewRecordError } = await this.supabase
        .from('forge_previews')
        .select('moderation_status, moderation_reasons')
        .eq('generation_id', generation_id)
        .maybeSingle();

      if (previewRecordError) {
        console.error('Preview lookup failed:', previewRecordError);
        res.status(500).json({
          error: 'Failed to verify safety checks',
          code: 'DB_FAIL',
        });
        return;
      }

      if (!previewRecord || previewRecord.moderation_status !== 'pass') {
        res.status(403).json({
          error: 'unsafe_prompt',
          code: 'UNSAFE_PROMPT',
        });
        return;
      }

      const similarityResult = await this.similarity.compareToBase(previewBytes);
      const safetyCheckedAt = new Date().toISOString();

      const { error: previewUpdateError } = await this.supabase
        .from('forge_previews')
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
      } catch (error: any) {
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
        .insert({
          id: releaseResult.artifactId,
          image_url: releaseResult.imageUrl,
          caption: caption || 'Untitled Artifact',
          tags,
          author_id: req.userId,
          author_handle: req.userHandle || null,
          author_avatar: req.userAvatar || null,
          moderation_status: previewRecord.moderation_status,
          moderation_reasons: previewRecord.moderation_reasons,
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
        artifact_id: artifact.id,
        image_url: releaseResult.imageUrl,
        redirect_url: `/archives/${artifact.id}`,
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error('Release error:', error);
      res.status(500).json({
        error: 'Failed to release artifact',
        code: 'STORAGE_FAIL',
      });
    }
  }
}
