import type { Preset, BaseId, PromptBuilderOutput } from '../types';
import {
  PRESETS,
  BRAND_DNA_BLOCK,
  FORBIDDEN_KEYWORDS,
  FORBIDDEN_PERSONS,
  MAX_INPUT_LENGTH,
  MAX_WORDS,
  DEFAULT_CONCEPT,
  BASE_IMAGES,
} from '../constants';

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

    // Check length
    if (sanitized.length > MAX_INPUT_LENGTH) {
      sanitized = sanitized.substring(0, MAX_INPUT_LENGTH).trim();
    }

    // Check word count
    const words = sanitized.split(/\s+/);
    if (words.length > MAX_WORDS) {
      sanitized = words.slice(0, MAX_WORDS).join(' ');
    }

    // Check for forbidden keywords
    const lowerInput = sanitized.toLowerCase();
    const foundForbidden: string[] = [];

    for (const keyword of FORBIDDEN_KEYWORDS) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        foundForbidden.push(keyword);
        // Remove or replace forbidden keyword
        const regex = new RegExp(keyword, 'gi');
        sanitized = sanitized.replace(regex, '').trim();
      }
    }

    // Check for forbidden persons
    for (const person of FORBIDDEN_PERSONS) {
      if (lowerInput.includes(person.toLowerCase())) {
        foundForbidden.push(person);
        // Replace with generic term
        const regex = new RegExp(person, 'gi');
        sanitized = sanitized.replace(regex, 'symbolic figure').trim();
      }
    }

    // Clean up multiple spaces again
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // If too much was removed or input is now empty, use default
    if (!sanitized || sanitized.length < 3) {
      return {
        sanitized: DEFAULT_CONCEPT,
        negativeTerms: foundForbidden,
        status: foundForbidden.length > 0 ? 'rejected' : 'ok',
      };
    }

    return {
      sanitized,
      negativeTerms: foundForbidden,
      status: foundForbidden.length > 0 ? 'sanitized' : 'ok',
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
    const baseDescription = BASE_IMAGES[baseId].description;

    // Build concept summary
    const conceptSummary = `Surreal horny-meta meme scene: ${sanitizedInput}. Unicorn character infused with the concept, drawn in neon-yellow sketch doodle style on black background.`;

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
  }): PromptBuilderOutput & { negativeTerms: string[] } {
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

