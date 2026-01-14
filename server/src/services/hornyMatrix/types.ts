/**
 * HornyMatrix Types
 */

export type Intent = 'reaction' | 'situation' | 'character' | 'symbol' | 'headline' | 'parody';

export type Energy = 1 | 2 | 3 | 4 | 5;

export type Flavor =
  | 'mischievous'
  | 'ironic'
  | 'chaotic'
  | 'cursed'
  | 'delusional'
  | 'divine'
  | 'innocent_wrong'
  | 'dominant';

export type SafetyRewriteMode = 'none' | 'metaphorize' | 'abstract' | 'sanitize_strict';

export type CompositionPattern = 'A' | 'B' | 'C';

export type MemeTemplateKey =
  | 'top_bottom'
  | 'caption_single'
  | 'reaction_card'
  | 'comic_2panel'
  | 'chart_meme';

export interface MatrixContextObject {
  id: string;
  label: string;
  allowedColors: string[];
}

export interface HornyMatrixSelection {
  intent: Intent;
  energy: Energy;
  flavor: Flavor;
  pattern: CompositionPattern;
  template: MemeTemplateKey;
  contextObjects: MatrixContextObject[];
  accentColors: string[];
  bannedTopicsHit: boolean;
  rewriteMode: SafetyRewriteMode;
  seedHint?: string;
}

export interface MemeGenPromptPack {
  finalPrompt: string;
  negativePrompt: string;
  meta: HornyMatrixSelection & {
    noveltyScore: number;
    riskScore: number;
    usedGuardrails: string[];
    fallback_used?: boolean;
    fallback_stage?: string;
  };
}

export interface MatrixMeta {
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

