import crypto from 'crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { RequestHandler, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import type { ForgeController } from '../controllers/ForgeController';
import type { Database } from '../types/supabase';

type SupabaseMock = ReturnType<typeof createMockSupabase>;

function createMockSupabase() {
  const artifacts = new Map([
    [
      'artifact-1',
      {
        id: 'artifact-1',
        caption: 'Cosmic Relic',
        author_handle: 'tester',
        image_url: 'https://cdn.example.com/artifact-1.png',
      },
    ],
  ]);
  const awardedEvents = new Map<string, number>();

  return {
    awardedEvents,
    from(table: string) {
      if (table !== 'artifacts') {
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
      }

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
          return Promise.resolve({ data: id ? artifacts.get(id) ?? null : null, error: null });
        },
      };
    },
    rpc(_fn: string, params: Database['public']['Functions']['award_event']['Args']) {
      const eventId = params.p_event_id;
      const count = awardedEvents.get(eventId) ?? 0;
      awardedEvents.set(eventId, count + 1);
      return Promise.resolve({ data: { noop: count > 0 }, error: null });
    },
  };
}

class MockForgeController {
  async forge(req: AuthenticatedRequest, res: Response) {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }
    if (req.body?.base_id === 'base-04' || req.body?.preset === 'HORNY_CHAOS_VARIATION') {
      res.status(403).json({ error: 'locked' });
      return;
    }
    if (req.headers['x-test-quota'] === 'exceeded') {
      res.status(429).json({ error: 'Daily forge limit reached', code: 'FORGE_LIMIT', remaining: 0 });
      return;
    }
    res.status(200).json({ ok: true });
  }

  async release(req: AuthenticatedRequest, res: Response) {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }
    if (req.headers['x-test-moderation'] === 'fail') {
      res.status(403).json({ error: 'unsafe_prompt', code: 'UNSAFE_PROMPT' });
      return;
    }
    if (req.headers['x-test-similarity'] === 'low') {
      res.status(403).json({ error: 'off_brand', code: 'OFF_BRAND', brand_similarity: 0.12 });
      return;
    }
    res.status(200).json({ ok: true });
  }
}

describe('smoke tests', () => {
  let app: Awaited<ReturnType<typeof import('../app')['createApp']>>;
  let supabaseMock: SupabaseMock;

  beforeAll(async () => {
    process.env.SHARE_TOKEN_SECRET = 'test-share-secret';
    process.env.TOKEN_STATS_TTL_MS = '60000';

    const { createApp } = await import('../app');
    supabaseMock = createMockSupabase();

    const eventSeen = new Set<string>();
    type AwardEventArgs = {
      event_id: string;
      type: string;
      actorUserId: string;
      subject_id?: string;
      source?: string;
      metadata?: Record<string, unknown>;
      proof?: Record<string, unknown>;
    };
    const awardEventMock = async (args: AwardEventArgs) => {
      if (args.type === 'vote_received' && args.proof && typeof args.proof === 'object' && 'vote_id' in args.proof && args.proof.vote_id !== 'vote-1') {
        throw Object.assign(new Error('invalid_vote'), { status: 403, code: 'invalid_vote' });
      }
      if (eventSeen.has(args.event_id)) {
        return { noop: true };
      }
      eventSeen.add(args.event_id);
      return { noop: false };
    };

    const authMiddleware: RequestHandler = (req, _res, next) => {
      const userId = req.headers['x-test-user'];
      if (typeof userId === 'string' && userId.length > 0) {
        (req as AuthenticatedRequest).userId = userId;
      }
      next();
    };

    app = await createApp({
      forgeController: new MockForgeController() as unknown as ForgeController,
      authMiddleware,
      awardEvent: awardEventMock,
      supabaseAdmin: supabaseMock as unknown as ReturnType<typeof import('@supabase/supabase-js')['createClient']<Database>>,
    });

    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('api.dexscreener.com')) {
        return new Response(
          JSON.stringify([
            {
              url: 'https://dex.example.com/pair',
              priceUsd: '1.23',
              marketCap: 1200000,
              liquidity: { usd: 90000 },
              volume: { h24: 45000 },
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return originalFetch(input, init);
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('forge requires auth', async () => {
    const res = await request(app).post('/api/forge').send({});
    expect(res.status).toBe(401);
  });

  it('forge locked preset/base returns 403', async () => {
    const res = await request(app)
      .post('/api/forge')
      .set('x-test-user', 'user-1')
      .send({ base_id: 'base-04', preset: 'HORNY_CHAOS_VARIATION', user_input: 'test' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('locked');
  });

  it('forge quota exceeded returns 429', async () => {
    const res = await request(app)
      .post('/api/forge')
      .set('x-test-user', 'user-1')
      .set('x-test-quota', 'exceeded')
      .send({ base_id: 'base-01', preset: 'HORNY_CORE_SKETCH', user_input: 'test' });
    expect(res.status).toBe(429);
  });

  it('release blocked when moderation fails', async () => {
    const res = await request(app)
      .post('/api/forge/release')
      .set('x-test-user', 'user-1')
      .set('x-test-moderation', 'fail')
      .send({ generation_id: 'gen-1', tags: ['test'] });
    expect(res.status).toBe(403);
  });

  it('release blocked when brand similarity is low', async () => {
    const res = await request(app)
      .post('/api/forge/release')
      .set('x-test-user', 'user-1')
      .set('x-test-similarity', 'low')
      .send({ generation_id: 'gen-1', tags: ['test'] });
    expect(res.status).toBe(403);
  });

  it('duplicate event_id returns noop', async () => {
    const eventId = crypto.randomUUID();
    const payload = { event_id: eventId, type: 'forge_generate' };
    await request(app).post('/api/event').set('x-test-user', 'user-1').send(payload);
    const res = await request(app).post('/api/event').set('x-test-user', 'user-1').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.noop).toBe(true);
  });

  it('vote_received without valid vote_id returns 403', async () => {
    const res = await request(app)
      .post('/api/event')
      .set('x-test-user', 'user-1')
      .send({ event_id: crypto.randomUUID(), type: 'vote_received', proof: { vote_id: 'missing' } });
    expect(res.status).toBe(403);
  });

  it('share redirect awards once for valid token', async () => {
    const { signShareToken } = await import('../utils/signing');
    const token = signShareToken({ actor_user_id: 'user-1', subject_id: 'artifact-1' });
    await request(app).get(`/s/artifact-1?t=${token}`);
    await request(app).get(`/s/artifact-1?t=${token}`);
    expect(supabaseMock.awardedEvents.size).toBe(1);
  });

  it('share redirect with invalid token does not award', async () => {
    await request(app).get('/s/artifact-1?t=invalid');
    expect(supabaseMock.awardedEvents.size).toBe(1);
  });

  it('share redirect returns 302', async () => {
    const res = await request(app).get('/s/artifact-1');
    expect(res.status).toBe(302);
  });

  it('token stats returns normalized shape and caches', async () => {
    const res1 = await request(app).get('/api/token-stats?mint=abc');
    const res2 = await request(app).get('/api/token-stats?mint=abc');
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.stats).toBeDefined();
    const fetchMock = vi.mocked(globalThis.fetch);
    expect(
      fetchMock.mock.calls.filter(([input]: [string | URL, RequestInit?]) => String(input).includes('api.dexscreener.com')).length
    ).toBe(1);
  });

  it('og wrapper returns expected meta tags', async () => {
    const res = await request(app).get('/artifact/artifact-1');
    expect(res.status).toBe(200);
    expect(res.text).toContain('og:title');
    expect(res.text).toContain('og:image');
    expect(res.text).toContain('twitter:card');
  });
});
