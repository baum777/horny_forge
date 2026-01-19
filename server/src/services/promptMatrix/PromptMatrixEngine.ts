import type { PromptMatrixNudges, PromptMatrixSelection, MatrixFlavor, MatrixIntent, MatrixPattern, RewriteMode, Energy } from './types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));


const pickIntent = (prompt: string): MatrixIntent => {
  const lower = prompt.toLowerCase();
  if (/(moon|pump|bull|ath|rocket|victory)/.test(lower)) return 'hype';
  if (/(cope|bag|downbad|stuck|lost)/.test(lower)) return 'copium';
  if (/(dump|rekt|rug|panic|crash)/.test(lower)) return 'panic';
  if (/(magic|ritual|oracle|mystic|temple)/.test(lower)) return 'mystic';
  if (/(chaos|glitch|absurd|brainrot)/.test(lower)) return 'chaos';
  return 'victory';
};

const pickFlavor = (prompt: string, fallback: MatrixFlavor): MatrixFlavor => {
  const lower = prompt.toLowerCase();
  if (/(glitch|pixel|crt|noise)/.test(lower)) return 'glitch';
  if (/(myth|legend|temple|oracle|divine)/.test(lower)) return 'mythic';
  if (/(degen|chaos|ape|degenerate)/.test(lower)) return 'degenerate';
  if (/(retro|vhs|arcade)/.test(lower)) return 'retro';
  if (/(clean|minimal|simple)/.test(lower)) return 'clean';
  return fallback;
};

const resolveRewriteMode = (flags: string[]): RewriteMode => {
  if (flags.includes('explicit')) return 'metaphorize';
  if (flags.includes('person') || flags.includes('pii')) return 'abstract';
  return 'strict';
};

const buildContext = (intent: MatrixIntent, energy: number, flavor: MatrixFlavor, pattern: MatrixPattern): string[] => {
  const context: string[] = [];

  const base = {
    hype: 'exploding candlesticks',
    copium: 'melting chart totems',
    victory: 'victory sigils',
    panic: 'shattered tickers',
    mystic: 'arcane rune grid',
    chaos: 'glitching meme glyphs',
  } satisfies Record<MatrixIntent, string>;

  context.push(base[intent]);

  if (energy >= 4) context.push('overclocked neon aura');
  if (pattern !== 'A') context.push('floating meme props');
  if (flavor === 'glitch') context.push('scanline distortion');
  if (flavor === 'mythic') context.push('temple backdrop');
  if (flavor === 'retro') context.push('arcade grid');

  return context.slice(0, pattern === 'A' ? 2 : pattern === 'B' ? 3 : 4);
};

export class PromptMatrixEngine {
  getEnergyCap(userLevel: number): number {
    if (userLevel >= 7) return 5;
    if (userLevel >= 5) return 4;
    if (userLevel >= 3) return 3;
    return 2;
  }

  clampEnergy(userLevel: number, requested?: number): { energy?: Energy; clamped: boolean } {
    if (typeof requested !== 'number') return { energy: undefined, clamped: false };
    const cap = this.getEnergyCap(userLevel);
    const val = Math.min(requested, cap);
    return { energy: val as Energy, clamped: requested > cap };
  }

  select(params: {
    userPrompt: string;
    nudges?: PromptMatrixNudges;
    flags?: string[];
  }): PromptMatrixSelection {
    const { userPrompt, nudges, flags = [] } = params;

    const energy = clamp(nudges?.energy ?? 3, 1, 5) as Energy;
    const intent = pickIntent(userPrompt);
    const flavor = nudges?.flavor ?? pickFlavor(userPrompt, 'absurdist');
    const pattern: MatrixPattern = energy <= 2 ? 'A' : energy <= 4 ? 'B' : 'C';
    const rewriteMode = resolveRewriteMode(flags);

    return {
      intent,
      energy,
      flavor,
      pattern,
      templateKey: nudges?.templateKey,
      context: buildContext(intent, energy, flavor, pattern),
      rewriteMode,
    };
  }

  selectSafeDefault(userPrompt: string): PromptMatrixSelection {
    const energy: Energy = 1;
    const intent = pickIntent(userPrompt);
    const flavor = pickFlavor(userPrompt, 'clean');
    const pattern: MatrixPattern = 'A';
    return {
      intent,
      energy,
      flavor,
      pattern,
      templateKey: undefined,
      context: buildContext(intent, energy, flavor, pattern),
      rewriteMode: 'strict',
    };
  }
}
