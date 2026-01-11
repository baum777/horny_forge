export type BaseId = 'base-01' | 'base-02' | 'base-03' | 'base-04';
export type Preset = 'HORNY_CORE_SKETCH' | 'HORNY_META_SCENE' | 'HORNY_CHAOS_VARIATION';

const BASE_IMAGES: Record<BaseId, { file: string; description: string }> = {
  'base-01': {
    file: 'base-01-unicorn-head.png',
    description: 'Unicorn head with rainbow horn, dot eyes, neon-yellow sketch style on black background',
  },
  'base-02': {
    file: 'base-02-landscape.png',
    description: 'Landscape scene with unicorn character, neon-yellow sketch doodle style, black background',
  },
  'base-03': {
    file: 'base-03-jesus-meme.png',
    description: 'Epic meme scene with unicorn character, neon-yellow sketch style, high contrast',
  },
  'base-04': {
    file: 'base-04-rocket.png',
    description: 'Rocket launch scene with unicorn character, neon-yellow sketch doodle style, black background',
  },
};

const PRESETS: Record<Preset, { guardrailBlock: string }> = {
  HORNY_CORE_SKETCH: {
    guardrailBlock: `TIGHT STYLE: Minimal scene complexity. Focus on the unicorn character with simple props or symbols. Keep composition centered, clean silhouette.`,
  },
  HORNY_META_SCENE: {
    guardrailBlock: `EPIC SCENE: Allow larger scene composition with background elements, multiple props, surreal elements. Still maintain neon sketch doodle style throughout. Centered subject with readable composition.`,
  },
  HORNY_CHAOS_VARIATION: {
    guardrailBlock: `CHAOTIC VARIATION: Allow surreal distortion, glitch effects, abstract symbols, brainrot aesthetics. Maintain brand identity (unicorn + neon sketch) but allow creative chaos.`,
  },
};

const BRAND_DNA_BLOCK = `STYLE GUARDRAIL: neon-yellow glowing sketch lines on a black background, thick marker doodle outline, simple cartoon shapes, high contrast, meme readability, no realism, no 3D, no painterly textures. Preserve the exact unicorn character identity from the provided base image (same head shape, dot eyes, rainbow horn always visible).`;

const FORBIDDEN_KEYWORDS = [
  'photorealistic',
  'realistic',
  'hyperreal',
  'cinematic photo',
  'dslr',
  '3d render',
  'octane',
  'blender',
  'unreal engine',
  'ray tracing',
  'oil painting',
  'watercolor',
  'painterly',
  'brushstrokes',
  'textured brushwork',
  'nsfw',
  'nude',
  'nudity',
  'explicit',
];

const FORBIDDEN_PERSONS = [
  'elon musk',
  'musk',
  'celebrities',
  'real person',
];

const MAX_INPUT_LENGTH = 240;
const MAX_WORDS = 40;
const DEFAULT_CONCEPT = 'cosmic neon doodle, absurd hype symbols';

export function sanitizeInput(input: string): { sanitized: string; negativeTerms: string[]; status: 'ok' | 'sanitized' | 'rejected' } {
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
      const regex = new RegExp(keyword, 'gi');
      sanitized = sanitized.replace(regex, '').trim();
    }
  }

  // Check for forbidden persons
  for (const person of FORBIDDEN_PERSONS) {
    if (lowerInput.includes(person.toLowerCase())) {
      foundForbidden.push(person);
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

export function buildPrompt(params: {
  preset: Preset;
  sanitizedInput: string;
  baseId: BaseId;
}): string {
  const { preset, sanitizedInput, baseId } = params;

  const presetBlock = PRESETS[preset].guardrailBlock;
  const baseDescription = BASE_IMAGES[baseId].description;

  const finalPrompt = `${BRAND_DNA_BLOCK} ${presetBlock} Create a surreal horny-meta meme scene: ${sanitizedInput}. The unicorn character from the base image should be infused with this concept, maintaining the exact same character identity (head shape, dot eyes, rainbow horn always visible). Everything must be drawn in the same neon-yellow glowing sketch doodle style on a black background. High contrast, meme readability, clean silhouette, square composition.`;

  return finalPrompt;
}

export function processPrompt(params: {
  preset: Preset;
  userInput: string;
  baseId: BaseId;
}): { final_prompt: string; sanitized_input: string; negative_terms: string[] } {
  const sanitizeResult = sanitizeInput(params.userInput);
  const finalPrompt = buildPrompt({
    preset: params.preset,
    sanitizedInput: sanitizeResult.sanitized,
    baseId: params.baseId,
  });

  return {
    final_prompt: finalPrompt,
    sanitized_input: sanitizeResult.sanitized,
    negative_terms: sanitizeResult.negativeTerms,
  };
}

export function getBaseImagePath(baseId: BaseId): string {
  return `/bases/${BASE_IMAGES[baseId].file}`;
}

