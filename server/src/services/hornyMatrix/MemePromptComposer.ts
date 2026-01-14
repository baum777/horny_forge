/**
 * MemePromptComposer - Composes prompts from HornyMatrix selections
 * 
 * CRITICAL: This service MUST never fail without producing a prompt with Brand Directives.
 * All errors are caught and handled via composeFallback().
 */

import type { HornyMatrixSelection, MemeGenPromptPack } from './types';

export interface ComposeInput {
  rewritten_prompt: string;
  selection: HornyMatrixSelection;
}

export interface ComposeFallbackInput {
  rewritten_prompt: string;
  selection: Partial<HornyMatrixSelection>;
}

/**
 * Brand Directives that MUST always be present in any prompt
 */
const BRAND_DIRECTIVES = [
  'bold silhouette',
  'high contrast',
  'readable at 32px',
  'no text / no letters / no logos',
  'symbolic over literal',
];

/**
 * Safe fallback selection (energy=1, pattern=A, safe flavor)
 */
const SAFE_FALLBACK_SELECTION: HornyMatrixSelection = {
  intent: 'reaction',
  energy: 1,
  flavor: 'ironic',
  pattern: 'A',
  template: 'top_bottom',
  contextObjects: [],
  accentColors: [],
  bannedTopicsHit: false,
  rewriteMode: 'metaphorize',
};

/**
 * Composes a prompt pack from matrix selection.
 * 
 * @throws Never throws - all errors are handled via fallback
 */
export function compose(input: ComposeInput): MemeGenPromptPack {
  try {
    const { rewritten_prompt, selection } = input;

    // Build template-specific skeleton
    const templateSkeleton = buildTemplateSkeleton(selection.template, selection.pattern);

    // Build composition directives
    const compositionDirectives = buildCompositionDirectives(selection);

    // Build final prompt with Brand Directives
    const finalPrompt = [
      rewritten_prompt,
      templateSkeleton,
      compositionDirectives,
      `Brand Directives: ${BRAND_DIRECTIVES.join(', ')}`,
    ].filter(Boolean).join('. ');

    // Build negative prompt
    const negativePrompt = [
      'text',
      'watermark',
      'logo',
      'letters',
      'blurry',
      'low-contrast',
      'clutter',
      'tiny details',
      'photorealistic',
    ].join(', ');

    return {
      finalPrompt,
      negativePrompt,
      meta: {
        ...selection,
        noveltyScore: 0.5,
        riskScore: 0.2,
        usedGuardrails: [],
      },
    };
  } catch (error) {
    // This should never happen, but if it does, use fallback
    console.error('[MemePromptComposer] compose() error:', error);
    return composeFallback({
      rewritten_prompt: input.rewritten_prompt || 'meme scene',
      selection: input.selection || {},
    });
  }
}

/**
 * Fallback composer that ALWAYS produces a valid prompt with Brand Directives.
 * 
 * This method MUST never throw and MUST always include Brand Directives.
 */
export function composeFallback(input: ComposeFallbackInput): MemeGenPromptPack {
  const { rewritten_prompt, selection } = input;

  // Use safe fallback selection, merging with provided selection
  const safeSelection: HornyMatrixSelection = {
    ...SAFE_FALLBACK_SELECTION,
    ...selection,
    energy: (selection.energy ?? 1) as 1 | 2 | 3 | 4 | 5,
    pattern: (selection.pattern ?? 'A') as 'A' | 'B' | 'C',
    template: (selection.template ?? 'top_bottom') as any,
  };

  // Build minimal but safe prompt
  const finalPrompt = [
    rewritten_prompt || 'simple meme scene',
    `Pattern ${safeSelection.pattern}: isolated focus, minimal context`,
    `Brand Directives: ${BRAND_DIRECTIVES.join(', ')}`,
  ].join('. ');

  const negativePrompt = [
    'text',
    'watermark',
    'logo',
    'letters',
    'blurry',
    'low-contrast',
    'clutter',
  ].join(', ');

  return {
    finalPrompt,
    negativePrompt,
    meta: {
      ...safeSelection,
      noveltyScore: 0.3,
      riskScore: 0.1,
      usedGuardrails: ['COMPOSER_FALLBACK'],
      fallback_used: true,
      fallback_stage: 'composer',
    } as any,
  };
}

function buildTemplateSkeleton(template: string, pattern: string): string {
  const skeletons: Record<string, Record<string, string>> = {
    top_bottom: {
      A: 'single strong subject, bold silhouette, meme readable thumbnail, clean background',
      B: 'character + minimal scene hint, center focus, high contrast',
      C: 'full scene with clear subject, meme composition',
    },
    caption_single: {
      A: 'single subject + minimal scene hint, center focus',
      B: 'character + mini scene, balanced composition',
      C: 'full scene story frame, clear narrative',
    },
    reaction_card: {
      A: 'character bust framed for reaction card layout',
      B: 'character pose + context, safe margins',
      C: 'full reaction scene, clear emotional expression',
    },
    comic_2panel: {
      A: 'two sequential beats, clear contrast',
      B: 'two panels with character progression',
      C: 'full two-panel story, narrative flow',
    },
    chart_meme: {
      A: 'chart context scene, clean chart area',
      B: 'chart with comedic visual metaphor',
      C: 'full chart meme scene, visual storytelling',
    },
  };

  return skeletons[template]?.[pattern] || 'meme composition, clear focus';
}

function buildCompositionDirectives(selection: HornyMatrixSelection): string {
  const parts: string[] = [];

  parts.push(`Intent: ${selection.intent}`);
  parts.push(`Energy: ${selection.energy}`);
  parts.push(`Flavor: ${selection.flavor}`);
  parts.push(`Pattern ${selection.pattern}`);

  if (selection.contextObjects.length > 0) {
    parts.push(`Context: ${selection.contextObjects.map(c => c.label).join(', ')}`);
  }

  return parts.join('; ');
}

