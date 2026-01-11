export interface ForgeRequest {
  base_id: 'base-01' | 'base-02' | 'base-03' | 'base-04';
  preset: 'HORNY_CORE_SKETCH' | 'HORNY_META_SCENE' | 'HORNY_CHAOS_VARIATION';
  user_input: string;
  seed?: string;
  size?: '1024x1024';
}

export interface ForgeResponse {
  generation_id: string;
  base_id: string;
  preset: string;
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
  code:
    | 'INVALID_INPUT'
    | 'UNAUTHORIZED'
    | 'RATE_LIMIT'
    | 'PROMPT_REJECTED'
    | 'UNSAFE_PROMPT'
    | 'GEN_FAIL'
    | 'STORAGE_FAIL'
    | 'DB_FAIL'
    | 'NOT_FOUND';
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

export interface ReleaseError {
  error: string;
  code: 'INVALID_INPUT' | 'UNAUTHORIZED' | 'RATE_LIMIT' | 'UNSAFE_PROMPT' | 'OFF_BRAND' | 'STORAGE_FAIL' | 'DB_FAIL' | 'NOT_FOUND';
  brand_similarity?: number;
  base_match_id?: string | null;
}

import { supabase } from '@/integrations/supabase/client';

export async function forgeArtifact(data: ForgeRequest): Promise<ForgeResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw {
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
    } satisfies ForgeError;
  }

  const response = await fetch('/api/forge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      ...data,
      size: data.size || '1024x1024',
    }),
  });

  if (!response.ok) {
    const errorData: ForgeError = await response.json().catch(() => ({
      error: 'Artifact unstable. Retry.',
      code: 'GEN_FAIL',
    }));
    throw errorData;
  }

  return response.json();
}

export async function releaseArtifact(data: ReleaseRequest): Promise<ReleaseResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw {
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
    } satisfies ReleaseError;
  }

  const response = await fetch('/api/forge/release', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData: ReleaseError = await response.json().catch(() => ({
      error: 'Failed to release artifact',
      code: 'STORAGE_FAIL',
    }));
    throw errorData;
  }

  return response.json();
}
