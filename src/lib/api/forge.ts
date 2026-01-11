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
  code: 'INVALID_INPUT' | 'UNAUTHORIZED' | 'RATE_LIMIT' | 'PROMPT_REJECTED' | 'GEN_FAIL' | 'STORAGE_FAIL' | 'DB_FAIL' | 'NOT_FOUND';
  generation_id?: string;
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
