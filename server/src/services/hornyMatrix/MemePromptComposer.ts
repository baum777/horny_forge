/**
 * MemePromptComposer - Composes prompts from HornyMatrix selections
 *
 * CRITICAL: This service MUST never fail without producing a prompt with Brand Directives.
 * All errors are caught and handled via composeFallback().
 */

const BRAND_DIRECTIVES = [
  'bold silhouette',
  'high contrast',
  'readable at 32px',
  'no text / no letters / no logos',
  'symbolic over literal',
];

const SAFE_FALLBACK_SELECTION = {
  intent: 'reaction',
  energy: 1,
  flavor: 'ironic',
  pattern: 'A',
  rewriteMode: 'strict',
  context: [],
};

type ComposerInput = {
  rewrittenPrompt: string;
  selection: Record<string, unknown>;
  baseId: string;
  preset: string;
};

type PromptPack = {
  prompt: string;
  negativePrompt: string;
  meta: Record<string, unknown>;
  guardrailFlags: string[];
};

export class MemePromptComposer {
  compose(input: ComposerInput): PromptPack {
    try {
      return this.buildPrompt(input);
    } catch (error) {
      console.error('[MemePromptComposer] compose() error:', error);
      return this.composeFallback(input);
    }
  }

  buildPrompt(input: ComposerInput): PromptPack {
    const { rewrittenPrompt, selection, baseId } = input;
    const metaSelection = selection as {
      intent?: string;
      energy?: number;
      flavor?: string;
      pattern?: string;
      rewriteMode?: string;
      context?: string[];
      templateKey?: string;
    };

    const templateKey = metaSelection.templateKey ?? baseId;
    const pattern = metaSelection.pattern ?? 'A';
    const context = Array.isArray(metaSelection.context) ? metaSelection.context : [];

    const templateSkeleton = buildTemplateSkeleton(templateKey, pattern);
    const compositionDirectives = buildCompositionDirectives({
      intent: metaSelection.intent,
      energy: metaSelection.energy,
      flavor: metaSelection.flavor,
      pattern,
      context,
    });

    const prompt = [
      rewrittenPrompt,
      templateSkeleton,
      compositionDirectives,
      `Brand Directives: ${BRAND_DIRECTIVES.join(', ')}`,
      'no text in image',
    ]
      .filter(Boolean)
      .join('. ');

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
      prompt,
      negativePrompt,
      meta: {
        ...metaSelection,
        template_key: templateKey,
        rewrite_mode: metaSelection.rewriteMode,
        context,
        schema_version: 'v2',
        composer_version: 'v2',
        used_guardrails: [],
      },
      guardrailFlags: [],
    };
  }

  composeFallback(input: ComposerInput): PromptPack {
    const { rewrittenPrompt, selection, baseId } = input;
    const metaSelection = selection as {
      intent?: string;
      energy?: number;
      flavor?: string;
      pattern?: string;
      rewriteMode?: string;
      context?: string[];
      templateKey?: string;
    };

    const safeSelection = {
      ...SAFE_FALLBACK_SELECTION,
      ...metaSelection,
      energy: metaSelection.energy ?? SAFE_FALLBACK_SELECTION.energy,
      pattern: metaSelection.pattern ?? SAFE_FALLBACK_SELECTION.pattern,
      rewriteMode: metaSelection.rewriteMode ?? SAFE_FALLBACK_SELECTION.rewriteMode,
      context: Array.isArray(metaSelection.context) ? metaSelection.context : SAFE_FALLBACK_SELECTION.context,
    };

    const prompt = [
      rewrittenPrompt || 'simple meme scene',
      `Pattern ${safeSelection.pattern}: isolated focus, minimal context`,
      `Brand Directives: ${BRAND_DIRECTIVES.join(', ')}`,
      'no text in image',
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
      prompt,
      negativePrompt,
      meta: {
        ...safeSelection,
        template_key: metaSelection.templateKey ?? baseId,
        rewrite_mode: safeSelection.rewriteMode,
        schema_version: 'v2',
        composer_version: 'v2',
        used_guardrails: ['COMPOSER_FALLBACK'],
        fallback_used: true,
        fallback_stage: 'composer',
      },
      guardrailFlags: ['COMPOSER_FALLBACK'],
    };
  }
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

function buildCompositionDirectives(selection: {
  intent?: string;
  energy?: number;
  flavor?: string;
  pattern?: string;
  context?: string[];
}): string {
  const parts: string[] = [];

  if (selection.intent) parts.push(`Intent: ${selection.intent}`);
  if (selection.energy) parts.push(`Energy: ${selection.energy}`);
  if (selection.flavor) parts.push(`Flavor: ${selection.flavor}`);
  if (selection.pattern) parts.push(`Pattern ${selection.pattern}`);

  if (selection.context && selection.context.length > 0) {
    parts.push(`Context: ${selection.context.join(', ')}`);
  }

  return parts.join('; ');
}
