export type BaseId = 'base-01' | 'base-02' | 'base-03' | 'base-04';

export type Preset = 'HORNY_CORE_SKETCH' | 'HORNY_META_SCENE' | 'HORNY_CHAOS_VARIATION';

export interface ForgeRequest {
  base_id: BaseId;
  preset: Preset;
  user_input: string;
  size?: '1024x1024';
  seed?: string;
  debug?: boolean;
}

export interface ForgeResponse {
  generation_id: string;
  base_id: BaseId;
  preset: Preset;
  sanitized_input: string;
  image_url: string;
  created_at: string;
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
  code: 'INVALID_INPUT' | 'UNAUTHORIZED' | 'RATE_LIMIT' | 'PROMPT_REJECTED' | 'UNSAFE_PROMPT' | 'GEN_FAIL' | 'STORAGE_FAIL' | 'FORGE_LIMIT' | 'RELEASE_LIMIT' | 'DB_FAIL' | 'NOT_FOUND' | 'OFF_BRAND';
  generation_id?: string;
}

export interface ReleaseRequest {
  generation_id: string;
  caption?: string;
  tags: string[];
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
