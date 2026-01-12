import type { BaseId, Preset } from './types';

export const BASE_IMAGES: Record<BaseId, { file: string; description: string }> = {
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

export const PRESETS: Record<Preset, { guardrailBlock: string }> = {
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

export const BRAND_DNA_BLOCK = `STYLE GUARDRAIL: neon-yellow glowing sketch lines on a black background, thick marker doodle outline, simple cartoon shapes, high contrast, meme readability, no realism, no 3D, no painterly textures. Preserve the exact unicorn character identity from the provided base image (same head shape, dot eyes, rainbow horn always visible).`;

export const FORBIDDEN_KEYWORDS = [
  '3d',
  'realistic',
  'cinematic',
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

export const FORBIDDEN_PERSONS = [
  'elon musk',
  'musk',
  'celebrities',
  'real person',
];

export const MAX_INPUT_LENGTH = 240;
export const MAX_WORDS = 40;
export const DEFAULT_CONCEPT = 'cosmic neon doodle, absurd hype symbols';
