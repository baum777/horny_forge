import { supabase } from '@/integrations/supabase/client';

export async function getShareRedirectUrl(subjectId: string): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return null;

  const response = await fetch('/api/share-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ subject_id: subjectId }),
  });

  if (!response.ok) return null;

  const payload = (await response.json().catch(() => null)) as { token?: string; url?: string } | null;
  if (!payload) return null;
  if (payload.url) return payload.url;
  if (!payload.token) return null;

  return `${window.location.origin}/s/${subjectId}?t=${payload.token}`;
}
