import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../../src/middleware/auth';
import type { Database } from '../../src/types/supabase';

type ArtifactRecord = {
  id: string;
  caption: string | null;
  author_handle: string | null;
  image_url: string | null;
  matrix_meta?: Record<string, unknown> | null;
  scores?: Record<string, unknown> | null;
  created_at?: string | null;
  tags?: string[] | null;
};

type VoteRecord = {
  id: string;
  artifact_id: string;
  voter_id: string;
};

export type TestState = {
  artifacts: Map<string, ArtifactRecord>;
  votes: Map<string, VoteRecord>;
  awardedEvents: Map<string, number>;
  seenEvents: Set<string>;
};

let userCounter = 0;

export function createTestUser() {
  userCounter += 1;
  const userId = `test-user-${userCounter}`;
  const accessToken = `test.${Buffer.from(userId).toString('base64url')}.signature`;
  return { userId, accessToken };
}

export function createTestSession(userId: string) {
  const accessToken = `test.${Buffer.from(userId).toString('base64url')}.signature`;
  return {
    userId,
    accessToken,
    headers: {
      'x-test-user': userId,
    },
  };
}

export function createTestAuthMiddleware(): RequestHandler {
  return (req, _res, next) => {
    const userId = req.headers['x-test-user'];
    if (typeof userId === 'string' && userId.length > 0) {
      (req as AuthenticatedRequest).userId = userId;
    }
    next();
  };
}

export function createTestState(): TestState {
  return {
    artifacts: new Map(),
    votes: new Map(),
    awardedEvents: new Map(),
    seenEvents: new Set(),
  };
}

export function resetTestState(state: TestState) {
  state.artifacts.clear();
  state.votes.clear();
  state.awardedEvents.clear();
  state.seenEvents.clear();
}

export function insertArtifact(state: TestState, artifact: ArtifactRecord) {
  state.artifacts.set(artifact.id, artifact);
  return artifact;
}

export function insertVote(state: TestState, vote: VoteRecord) {
  state.votes.set(vote.id, vote);
  return vote;
}

export function createMockSupabase(state: TestState) {
  return {
    awardedEvents: state.awardedEvents,
    from(table: string) {
      if (table === 'artifacts') {
        let id: string | null = null;
        return {
          select() {
            return this;
          },
          eq(_column: string, value: string) {
            id = value;
            return this;
          },
          order() {
            return this;
          },
          range() {
            return Promise.resolve({
              data: Array.from(state.artifacts.values()),
              error: null,
            });
          },
          maybeSingle() {
            return Promise.resolve({
              data: id ? state.artifacts.get(id) ?? null : null,
              error: null,
            });
          },
        };
      }

      if (table === 'votes') {
        let id: string | null = null;
        return {
          select() {
            return this;
          },
          eq(_column: string, value: string) {
            id = value;
            return this;
          },
          maybeSingle() {
            return Promise.resolve({
              data: id ? state.votes.get(id) ?? null : null,
              error: null,
            });
          },
        };
      }

      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        maybeSingle() {
          return Promise.resolve({ data: null, error: null });
        },
      };
    },
    rpc(_fn: string, params: Database['public']['Functions']['award_event']['Args']) {
      const eventId = params.p_event_id;
      const count = state.awardedEvents.get(eventId) ?? 0;
      state.awardedEvents.set(eventId, count + 1);
      return Promise.resolve({ data: { noop: count > 0 }, error: null });
    },
  };
}

export function createAwardEventMock(state: TestState) {
  return async (args: {
    event_id: string;
    type: string;
    actorUserId: string;
    subject_id?: string;
    source?: string;
    metadata?: Record<string, unknown>;
    proof?: Record<string, unknown>;
  }): Promise<unknown> => {
    if (args.type === 'vote_received') {
      const voteId = args.proof && typeof args.proof === 'object' ? (args.proof as { vote_id?: string }).vote_id : undefined;
      if (!voteId || !state.votes.has(voteId)) {
        throw Object.assign(new Error('invalid_vote'), { status: 403, code: 'invalid_vote' });
      }
    }

    if (state.seenEvents.has(args.event_id)) {
      return { noop: true };
    }
    state.seenEvents.add(args.event_id);
    return { noop: false };
  };
}

export async function generateShareToken(input: { actor_user_id: string; subject_id?: string }) {
  const { signShareToken } = await import('../../src/utils/signing');
  return signShareToken(input);
}
