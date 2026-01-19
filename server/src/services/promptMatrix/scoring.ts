import type { PromptMatrixSelection, MatrixScores } from './types';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function scoreMatrix(params: {
  selection: PromptMatrixSelection;
  flags: string[];
  rewrittenPrompt: string;
}): MatrixScores {
  const { selection, flags, rewrittenPrompt } = params;
  const risk = clamp(flags.length * 0.12 + (selection.rewriteMode === 'metaphorize' ? 0.2 : 0));

  const noveltyBase = 0.45 + (selection.pattern === 'C' ? 0.15 : selection.pattern === 'B' ? 0.08 : 0);
  const novelty = clamp(noveltyBase + (selection.energy - 3) * 0.05);

  const coherenceBase = rewrittenPrompt.length > 10 ? 0.7 : 0.55;
  const coherence = clamp(coherenceBase + (selection.context.length >= 2 ? 0.1 : 0) - flags.length * 0.05);

  return {
    risk,
    novelty,
    coherence,
  };
}
