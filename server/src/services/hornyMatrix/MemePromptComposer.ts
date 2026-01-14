import { BASE_IMAGES, BRAND_DNA_BLOCK } from '../../constants';
import type { MemePromptPack, HornyMatrixSelection } from './types';

const BRAND_CONSTITUTION = [
  'bold silhouette',
  'high contrast',
  'symbolic storytelling',
  'emotionally overacted pose',
  '32px readable composition',
  'no text in image',
].join(', ');

const NEGATIVE_PROMPT = [
  'text',
  'watermark',
  'logo',
  'photorealistic',
  '3d render',
  'low contrast',
  'tiny unreadable details',
].join(', ');

const MAX_PROMPT_LENGTH = 900;

const clampPrompt = (value: string): { prompt: string; clamped: boolean } => {
  if (value.length <= MAX_PROMPT_LENGTH) return { prompt: value, clamped: false };
  return { prompt: value.slice(0, MAX_PROMPT_LENGTH).trim(), clamped: true };
};

export class MemePromptComposer {
  compose(params: {
    rewrittenPrompt: string;
    selection: HornyMatrixSelection;
    baseId: string;
    preset: string;
  }): MemePromptPack {
    const { rewrittenPrompt, selection, baseId, preset } = params;
    const baseDescription = BASE_IMAGES[baseId]?.description ?? 'Selected base image from the meme pool.';

    const contextLine = selection.context.length > 0 ? `Context props: ${selection.context.join(', ')}.` : '';
    const promptSource = [
      BRAND_DNA_BLOCK,
      `Horny Brand Constitution: ${BRAND_CONSTITUTION}.`,
      `Intent: ${selection.intent}. Energy: ${selection.energy}. Flavor: ${selection.flavor}. Pattern ${selection.pattern}.`,
      `Rewrite mode: ${selection.rewriteMode}.`,
      `Base reference: ${baseDescription}`,
      contextLine,
      `Scene: ${rewrittenPrompt}.`,
      `Preset: ${preset}.`,
    ]
      .filter(Boolean)
      .join(' ');

    const { prompt, clamped } = clampPrompt(promptSource);

    return {
      prompt,
      negative_prompt: NEGATIVE_PROMPT,
      guardrailFlags: clamped ? ['LENGTH_CLAMP'] : [],
      meta: {
        intent: selection.intent,
        energy: selection.energy,
        flavor: selection.flavor,
        pattern: selection.pattern,
        template_key: selection.templateKey,
        rewrite_mode: selection.rewriteMode,
        context: selection.context,
        base_id: baseId,
        preset,
        schema_version: 'v1',
        composer_version: 'v1',
      },
    };
  }
}
