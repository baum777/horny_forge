export interface ForgeRequest {
  base_id: 'base-01' | 'base-02' | 'base-03' | 'base-04';
  preset: 'HORNY_CORE_SKETCH' | 'HORNY_META_SCENE' | 'HORNY_CHAOS_VARIATION';
  user_input: string;
  seed?: string;
  size?: '1024x1024';
}

export interface ForgeResponse {
  image_url: string;
  final_prompt: string;
  preset: string;
  base_id: string;
  generation_id: string;
  created_at: string;
}

export interface ForgeError {
  error: string;
  code: 'INVALID_INPUT' | 'RATE_LIMIT' | 'GEN_FAIL';
}

export async function forgeArtifact(data: ForgeRequest): Promise<ForgeResponse> {
  const response = await fetch('/api/forge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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

