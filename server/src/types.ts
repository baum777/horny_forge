export type BaseId = string;

export type Preset = 'HORNY_CORE_SKETCH' | 'HORNY_META_SCENE' | 'HORNY_CHAOS_VARIATION';

export interface ForgeRequest {
  base_id?: BaseId;
  base_image?: string;
  preset: Preset;
  user_input?: string;
  user_prompt?: string;
  energy?: number;
  flavor?: string;
  template_key?: string;
  size?: '1024x1024';
  seed?: string;
  debug?: boolean;
  preview_request_id?: string;
}

export interface ForgeResponse {
  generation_id: string;
  base_id: BaseId;
  preset: Preset;
  sanitized_input: string;
  image_url: string;
  created_at: string;
  matrix_meta?: Record<string, unknown>;
  scores?: Record<string, unknown>;
  preview_request_id?: string;
  meta: {
    expires_in_seconds: number;
    model: string;
    size: string;
  };
  debug?: {
    final_prompt: string;
  };
}

export interface ForgeError {
  error: string;
  code: 'INVALID_INPUT' | 'UNAUTHORIZED' | 'RATE_LIMIT' | 'PROMPT_REJECTED' | 'GEN_FAIL' | 'GEN_UNAVAILABLE' | 'STORAGE_FAIL' | 'FORGE_LIMIT' | 'RELEASE_LIMIT' | 'DB_FAIL' | 'NOT_FOUND' | 'OFF_BRAND';
  generation_id?: string;
  remaining?: number;
  brand_similarity?: number;
  base_match_id?: string | null;
}

export interface ReleaseRequest {
  generation_id: string;
  caption?: string;
  tags: string[];
  remix_of?: string;
  release_request_id?: string;
}

export interface ReleaseResponse {
  artifact_id: string;
  image_url: string;
  redirect_url: string;
}

export interface PromptBuilderOutput {
  version: '1.0.0';
  preset: Preset;
  base_id: BaseId;
  sanitized_input: string;
  concept_summary: string;
  negative_terms: string[];
  final_prompt: string;
  safety?: {
    status: 'ok' | 'sanitized' | 'rejected';
    notes?: string;
  };
  debug?: {
    guardrail_block?: string;
    brand_dna_block?: string;
    composition_notes?: string;
  };
}
