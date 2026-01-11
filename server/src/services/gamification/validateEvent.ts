import { createClient } from '@supabase/supabase-js';
import { config } from '../../config';
import { verifySignedShareToken } from '../../utils/signing';
import type { Database } from '../../types/supabase';

const supabaseAdmin = createClient<Database>(config.supabase.url, config.supabase.serviceRoleKey);

type VoteProof = {
  vote_id: string;
};

type ShareProof = {
  token: string;
};

type EventProof = VoteProof | ShareProof | Record<string, unknown>;

type ValidateArgs = {
  type: string;
  actorUserId: string;
  subject_id?: string;
  proof?: EventProof;
};

export async function validateEventOrThrow(args: ValidateArgs) {
  const { type, actorUserId, proof, subject_id } = args;

  if (type === 'vote_received') {
    const voteProof = proof as VoteProof | undefined;
    const voteId = voteProof?.vote_id;
    if (!voteId || typeof voteId !== 'string') {
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

    type VoteWithArtifact = typeof vote & {
      artifacts: { author_id: string } | null;
    };
    const voteWithArtifact = vote as VoteWithArtifact;
    const authorId = voteWithArtifact.artifacts?.author_id;
    if (!authorId || authorId !== actorUserId) {
      throw Object.assign(new Error('vote does not belong to actor'), { status: 403, code: 'vote_mismatch' });
    }

    if (subject_id && String(vote.artifact_id) !== String(subject_id)) {
      throw Object.assign(new Error('subject mismatch'), { status: 403, code: 'subject_mismatch' });
    }
  }

  if (type === 'share_click') {
    const shareProof = proof as ShareProof | undefined;
    const token = shareProof?.token;
    if (!token || typeof token !== 'string') {
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
