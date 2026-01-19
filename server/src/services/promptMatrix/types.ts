/**
 * PromptMatrix Types
 */

export type Intent = 'hype' | 'copium' | 'panic' | 'mystic' | 'chaos' | 'victory';

export type Energy = 1 | 2 | 3 | 4 | 5;

export type Flavor =
  | 'glitch'
  | 'mythic'
  | 'degenerate'
  | 'retro'
  | 'clean'
  | 'absurdist';

export type SafetyRewriteMode = 'strict' | 'metaphorize' | 'abstract' | 'sanitize_strict';

export type CompositionPattern = 'A' | 'B' | 'C';

export type MatrixIntent = Intent;
export type MatrixFlavor = Flavor;
export type MatrixPattern = CompositionPattern;
export type RewriteMode = SafetyRewriteMode;

export type TemplateKey =
  | 'top_bottom'
  | 'caption_single'
  | 'reaction_card'
  | 'comic_2panel'
  | 'chart_meme';

export type PromptMatrixNudges = {
  energy?: Energy;
  flavor?: MatrixFlavor;
  templateKey?: TemplateKey;
};

export interface MatrixContextObject {
  id: string;
  label: string;
  allowedColors: string[];
}

export interface PromptMatrixSelection {
  intent: Intent;
  energy: Energy;
  flavor: Flavor;
  pattern: CompositionPattern;
  templateKey?: TemplateKey;
  context: string[];
  rewriteMode: SafetyRewriteMode;
}

export interface GenerationPromptPack {
  finalPrompt: string;
  negativePrompt: string;
  meta: PromptMatrixSelection & {
    noveltyScore: number;
    riskScore: number;
    usedGuardrails: string[];
    fallback_used?: boolean;
    fallback_stage?: string;
  };
}

export interface MatrixScores {
  risk: number;
  novelty: number;
  coherence: number;
}

export interface PromptMatrixMeta {
  schema_version?: string;
  fallback_used?: boolean;
  fallback_stage?: string;
  legacy_record?: boolean;
  intent?: Intent;
  energy?: Energy;
  flavor?: Flavor;
  pattern?: CompositionPattern;
  noveltyScore?: number;
  riskScore?: number;
  coherenceScore?: number;
  used_guardrails?: string[];
}

export interface SafetyRewriteResult {
  rewrittenPrompt: string;
  flags: string[];
  usedGuardrails: string[];
}
