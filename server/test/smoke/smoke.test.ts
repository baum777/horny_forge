import crypto from 'crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../src/middleware/auth';
import type { ForgeController } from '../../src/controllers/ForgeController';
import type { Database } from '../../src/types/supabase';
import {
  createAwardEventMock,
  createMockSupabase,
  createTestAuthMiddleware,
  createTestSession,
  createTestState,
  generateShareToken,
  insertArtifact,
  insertVote,
} from '../helpers';

type SupabaseMock = ReturnType<typeof createMockSupabase>;

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
    if (req.headers['x-test-similarity'] === 'low') {
      res.status(403).json({ error: 'off_brand', code: 'OFF_BRAND', brand_similarity: 0.12 });
      return;
    }
    res.status(200).json({ ok: true });
  }
}

describe('smoke tests', () => {
  let app: Awaited<ReturnType<typeof import('../../src/app')['createApp']>>;
  let supabaseMock: SupabaseMock;

  beforeAll(async () => {
    process.env.SHARE_TOKEN_SECRET = 'test-share-secret';
    process.env.TOKEN_STATS_TTL_MS = '60000';

    const { createApp } = await import('../../src/app');
    const state = createTestState();
    supabaseMock = createMockSupabase(state);

    insertArtifact(state, {
      id: 'artifact-1',
      caption: 'Cosmic Relic',
      author_handle: 'tester',
      image_url: 'https://cdn.example.com/artifact-1.png',
    });

    insertVote(state, {
      id: 'vote-1',
      artifact_id: 'artifact-1',
      voter_id: 'user-2',
    });

    const authMiddleware = createTestAuthMiddleware();
    const awardEventMock = createAwardEventMock(state);

    const SupabaseClient = (await import('@supabase/supabase-js')).createClient;
    type SupabaseClientType = ReturnType<typeof SupabaseClient<Database>>;
    app = await createApp({
      forgeController: new MockForgeController() as unknown as ForgeController,
      authMiddleware,
      awardEvent: awardEventMock,
      supabaseAdmin: supabaseMock as unknown as SupabaseClientType,
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
    const session = createTestSession('user-1');
    const res = await request(app)
      .post('/api/forge')
      .set(session.headers)
      .send({ base_id: 'base-04', preset: 'HORNY_CHAOS_VARIATION', user_input: 'test' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('locked');
  });

  it('forge quota exceeded returns 429', async () => {
    const session = createTestSession('user-1');
    const res = await request(app)
      .post('/api/forge')
      .set(session.headers)
      .set('x-test-quota', 'exceeded')
      .send({ base_id: 'base-01', preset: 'HORNY_CORE_SKETCH', user_input: 'test' });
    expect(res.status).toBe(429);
  });

  it('release blocked when brand similarity is low', async () => {
    const session = createTestSession('user-1');
    const res = await request(app)
      .post('/api/forge/release')
      .set(session.headers)
      .set('x-test-similarity', 'low')
      .send({ generation_id: 'gen-1', tags: ['test'] });
    expect(res.status).toBe(403);
  });

  it('duplicate event_id returns noop', async () => {
    const session = createTestSession('user-1');
    const eventId = crypto.randomUUID();
    const payload = { event_id: eventId, type: 'forge_generate' };
    await request(app).post('/api/event').set(session.headers).send(payload);
    const res = await request(app).post('/api/event').set(session.headers).send(payload);
    expect(res.status).toBe(200);
    expect(res.body.noop).toBe(true);
  });

  it('vote_received without valid vote_id returns 403', async () => {
    const session = createTestSession('user-1');
    const res = await request(app)
      .post('/api/event')
      .set(session.headers)
      .send({ event_id: crypto.randomUUID(), type: 'vote_received', proof: { vote_id: 'missing' } });
    expect(res.status).toBe(403);
  });

  it('share redirect awards once for valid token', async () => {
    const token = await generateShareToken({ actor_user_id: 'user-1', subject_id: 'artifact-1' });
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
      fetchMock.mock.calls.filter((call) => {
        const [input] = call;
        return String(input).includes('api.dexscreener.com');
      }).length
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
