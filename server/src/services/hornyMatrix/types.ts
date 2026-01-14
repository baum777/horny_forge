export type MatrixIntent = 'hype' | 'copium' | 'victory' | 'panic' | 'mystic' | 'chaos';
export type MatrixFlavor = 'absurdist' | 'mythic' | 'degenerate' | 'clean' | 'retro' | 'glitch';
export type MatrixPattern = 'A' | 'B' | 'C';
export type RewriteMode = 'metaphorize' | 'abstract' | 'strict';

export interface HornyMatrixNudges {
  energy?: number;
  flavor?: MatrixFlavor;
  templateKey?: string;
}

export interface HornyMatrixSelection {
  intent: MatrixIntent;
  energy: number;
  flavor: MatrixFlavor;
  pattern: MatrixPattern;
  templateKey?: string;
  context: string[];
  rewriteMode: RewriteMode;
}

export interface SafetyRewriteResult {
  rewrittenPrompt: string;
  flags: string[];
  usedGuardrails: string[];
}

export interface MatrixScores {
  risk: number;
  novelty: number;
  coherence: number;
}

export interface MemePromptPack {
  prompt: string;
  negative_prompt: string;
  guardrailFlags: string[];
  meta: {
    intent: MatrixIntent;
    energy: number;
    flavor: MatrixFlavor;
    pattern: MatrixPattern;
    template_key?: string;
    rewrite_mode: RewriteMode;
    context: string[];
    base_id: string;
    preset: string;
    schema_version: 'v1';
    composer_version: 'v1';
  };
}
