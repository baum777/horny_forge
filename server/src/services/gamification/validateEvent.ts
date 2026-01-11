import { createClient } from '@supabase/supabase-js';
import { config } from '../../config';
import { verifySignedShareToken } from '../../utils/signing';

const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey);

type ValidateArgs = {
  type: string;
  actorUserId: string;
  subject_id?: string;
  proof?: Record<string, any>;
};

export async function validateEventOrThrow(args: ValidateArgs) {
  const { type, actorUserId, proof, subject_id } = args;

  if (type === 'vote_received') {
    const voteId = proof?.vote_id;
    if (!voteId) {
      throw Object.assign(new Error('vote_id required'), { status: 400, code: 'missing_proof' });
    }

    const { data: vote, error } = await supabaseAdmin
      .from('votes')
      .select('id, artifact_id, user_id, artifacts!inner(author_id)')
      .eq('id', voteId)
      .maybeSingle();

    if (error) {
      throw Object.assign(new Error(error.message), { status: 500, code: 'db_error' });
    }
    if (!vote) {
      throw Object.assign(new Error('vote not found'), { status: 403, code: 'invalid_vote' });
    }

    const authorId = (vote as any).artifacts?.author_id as string | undefined;
    if (!authorId || authorId !== actorUserId) {
      throw Object.assign(new Error('vote does not belong to actor'), { status: 403, code: 'vote_mismatch' });
    }

    if (subject_id && String(vote.artifact_id) !== String(subject_id)) {
      throw Object.assign(new Error('subject mismatch'), { status: 403, code: 'subject_mismatch' });
    }
  }

  if (type === 'share_click') {
    const token = proof?.token;
    if (!token) {
      throw Object.assign(new Error('token required'), { status: 400, code: 'missing_proof' });
    }

    const payload = verifySignedShareToken(token);
    if (!payload) {
      throw Object.assign(new Error('invalid token'), { status: 403, code: 'invalid_share_token' });
    }

    if (payload.actor_user_id !== actorUserId) {
      throw Object.assign(new Error('token actor mismatch'), { status: 403, code: 'share_token_mismatch' });
    }
    if (subject_id && payload.subject_id && payload.subject_id !== subject_id) {
      throw Object.assign(new Error('token subject mismatch'), { status: 403, code: 'share_token_subject_mismatch' });
    }
  }
}
