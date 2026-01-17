import type { Preset, BaseId, PromptBuilderOutput } from '../types';
import {
  PRESETS,
  BRAND_DNA_BLOCK,
  MAX_INPUT_LENGTH,
  MAX_WORDS,
  DEFAULT_CONCEPT,
  BASE_IMAGES,
} from '../constants';

const STYLE_DISALLOWED_TERMS = [
  'photorealism',
  'photorealistic',
  'photo-realistic',
  'hyperrealistic',
  'hyper-realistic',
];

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeStyleHints = (input: string): string => {
  let output = input;

  for (const term of STYLE_DISALLOWED_TERMS) {
    const regex = new RegExp(escapeRegExp(term), 'gi');
    output = output.replace(regex, 'illustrated');
  }

  return output;
};

export class PromptEngine {
  /**
   * Sanitizes user input: normalizes whitespace, blocks forbidden content, truncates if needed.
   */
  static sanitizeInput(input: string): { sanitized: string; negativeTerms: string[]; status: 'ok' | 'sanitized' | 'rejected' } {
    const negativeTerms: string[] = [];
    let sanitized = input.trim();

    // Empty input → use default
    if (!sanitized) {
      return {
        sanitized: DEFAULT_CONCEPT,
        negativeTerms: [],
        status: 'ok',
      };
    }

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');
    const beforeStyleNormalization = sanitized;
    sanitized = normalizeStyleHints(sanitized);
    const styleSanitized = sanitized !== beforeStyleNormalization;

    // Check length
    if (sanitized.length > MAX_INPUT_LENGTH) {
      sanitized = sanitized.substring(0, MAX_INPUT_LENGTH).trim();
    }

    // Check word count
    const words = sanitized.split(/\s+/);
    if (words.length > MAX_WORDS) {
      sanitized = words.slice(0, MAX_WORDS).join(' ');
    }

    // Clean up multiple spaces again
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // If input is now empty or too short, use default
    if (!sanitized || sanitized.length < 3) {
      return {
        sanitized: DEFAULT_CONCEPT,
        negativeTerms,
        status: styleSanitized ? 'sanitized' : 'ok',
      };
    }

    return {
      sanitized,
      negativeTerms,
      status: styleSanitized ? 'sanitized' : 'ok',
    };
  }

  /**
   * Builds the final DALL·E-optimized prompt with guardrails.
   */
  static build(params: {
    preset: Preset;
    sanitizedInput: string;
    baseId: BaseId;
  }): PromptBuilderOutput {
    const { preset, sanitizedInput, baseId } = params;

    const presetBlock = PRESETS[preset].guardrailBlock;
    const baseDescription = BASE_IMAGES[baseId]?.description ?? 'Selected base image from the meme pool.';

    // Build concept summary
    const conceptSummary = `Surreal horny-meta meme scene: ${sanitizedInput}. ${baseDescription}`;

    // Build final prompt
    const finalPrompt = `${BRAND_DNA_BLOCK} ${presetBlock} Create a surreal horny-meta meme scene: ${sanitizedInput}. The unicorn character from the base image should be infused with this concept, maintaining the exact same character identity (head shape, dot eyes, rainbow horn always visible). Everything must be drawn in the same neon-yellow glowing sketch doodle style on a black background. High contrast, meme readability, clean silhouette, square composition.`;

    return {
      version: '1.0.0',
      preset,
      base_id: baseId,
      sanitized_input: sanitizedInput,
      concept_summary: conceptSummary,
      negative_terms: [],
      final_prompt: finalPrompt,
      safety: {
        status: 'ok',
      },
    };
  }

  /**
   * Full pipeline: sanitize + build prompt.
   */
  static process(params: {
    preset: Preset;
    userInput: string;
    baseId: BaseId;
  }): PromptBuilderOutput {
    const sanitizeResult = this.sanitizeInput(params.userInput);
    const promptResult = this.build({
      preset: params.preset,
      sanitizedInput: sanitizeResult.sanitized,
      baseId: params.baseId,
    });

    return {
      ...promptResult,
      negative_terms: sanitizeResult.negativeTerms,
      safety: {
        status: sanitizeResult.status,
        notes: sanitizeResult.negativeTerms.length > 0
          ? `Removed/blocked: ${sanitizeResult.negativeTerms.join(', ')}`
          : undefined,
      },
    };
  }
}
