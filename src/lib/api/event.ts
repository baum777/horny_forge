import { supabase } from '@/integrations/supabase/client';
import type { XpEventType } from 'lib/gamification/xp';

export type GamificationEventRequest = {
  event_id?: string;
  type: XpEventType;
  subject_id?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  proof?: Record<string, unknown>;
};

export type GamificationEventResponse = {
  xp_added: number;
  new_level: number;
  new_badges: string[];
  xp_total: number;
  level: number;
  streak_days: number;
};

export async function postGamificationEvent(payload: GamificationEventRequest) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    return { data: null as GamificationEventResponse | null, error: new Error('No session') };
  }

  const eventPayload = {
    ...payload,
    event_id: payload.event_id ?? crypto.randomUUID(),
  };

  const response = await fetch('/api/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(eventPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { data: null, error: new Error(errorText || 'Failed to process event') };
  }

  const responseData = (await response.json()) as GamificationEventResponse;
  return { data: responseData, error: null };
}
