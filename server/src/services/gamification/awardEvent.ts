import { createClient } from '@supabase/supabase-js';
import { config } from '../../config';
import { validateEventOrThrow } from './validateEvent';
import type { Database } from '../../types/supabase';

const supabaseAdmin = createClient<Database>(config.supabase.url, config.supabase.serviceRoleKey);

type AwardArgs = {
  event_id: string;
  type: string;
  actorUserId: string;
  subject_id?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  proof?: Record<string, unknown>;
};

export async function awardEvent(args: AwardArgs) {
  await validateEventOrThrow({
    type: args.type,
    actorUserId: args.actorUserId,
    subject_id: args.subject_id,
    proof: args.proof,
  });

  const { data, error } = await supabaseAdmin.rpc('award_event', {
    p_event_id: args.event_id,
    p_actor_user_id: args.actorUserId,
    p_event_type: args.type,
    p_subject_id: args.subject_id ?? null,
    p_source: args.source ?? null,
  });

  if (error) {
    throw Object.assign(new Error(error.message), { status: 500, code: 'award_rpc_failed' });
  }

  return data;
}
