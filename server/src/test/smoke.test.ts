import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';
import type { RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import type { signShareToken as SignShareToken } from '../utils/signing';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

type TestResult = boolean | { pass: boolean; message?: string };

function test(
  name: string,
  fn: () => Promise<TestResult> | TestResult,
  record: { passed: number; failed: number }
) {
  return Promise.resolve()
    .then(() => fn())
    .then((result) => {
      const pass = typeof result === 'boolean' ? result : result.pass;
      if (pass) {
        console.log(`✅ ${name}`);
        record.passed += 1;
      } else {
        const message = typeof result === 'object' ? result.message : '';
        console.log(`❌ ${name}${message ? `: ${message}` : ''}`);
        record.failed += 1;
      }
    })
    .catch((error: any) => {
      console.log(`❌ ${name}: ${error.message}`);
      record.failed += 1;
    });
}

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
    rpc(_fn: string, params: Record<string, any>) {
      const eventId = params.p_event_id as string;
      const count = awardedEvents.get(eventId) ?? 0;
      awardedEvents.set(eventId, count + 1);
      return Promise.resolve({ data: { noop: count > 0 }, error: null });
    },
  };
}

class MockForgeController {
  async forge(req: AuthenticatedRequest, res: any) {
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

  async release(req: AuthenticatedRequest, res: any) {
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

async function runTests() {
  console.log('🧪 Running smoke tests...\n');

  process.env.TOKEN_STATS_TTL_MS = '60000';

  const { createApp } = await import('../app');

  const supabaseMock = createMockSupabase();
  const { signShareToken } = (await import('../utils/signing')) as { signShareToken: typeof SignShareToken };
  const eventSeen = new Set<string>();
  const awardEventMock = async (args: any) => {
    if (args.type === 'vote_received') {
      if (args.proof?.vote_id !== 'vote-1') {
        throw Object.assign(new Error('invalid_vote'), { status: 403, code: 'invalid_vote' });
      }
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

  const app = await createApp({
    forgeController: new MockForgeController() as any,
    authMiddleware,
    awardEvent: awardEventMock,
    supabaseAdmin: supabaseMock as any,
  });

  const server = await new Promise<{ url: string; close: () => Promise<void> }>((resolve) => {
    const instance = app.listen(0, () => {
      const address = instance.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise<void>((done) => {
            instance.close(() => done());
          }),
      });
    });
  });

  let fetchCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('api.dexscreener.com')) {
      fetchCount += 1;
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
  }) as typeof fetch;

  const record = { passed: 0, failed: 0 };

  await test('Forge requires auth', async () => {
    const res = await fetch(`${server.url}/api/forge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    return res.status === 401;
  }, record);

  await test('Forge locked preset/base returns 403', async () => {
    const res = await fetch(`${server.url}/api/forge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-user': 'user-1' },
      body: JSON.stringify({ base_id: 'base-04', preset: 'HORNY_CHAOS_VARIATION', user_input: 'test' }),
    });
    const payload = await res.json();
    return res.status === 403 && payload.error === 'locked';
  }, record);

  await test('Forge quota exceeded returns 429', async () => {
    const res = await fetch(`${server.url}/api/forge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-user': 'user-1', 'x-test-quota': 'exceeded' },
      body: JSON.stringify({ base_id: 'base-01', preset: 'HORNY_CORE_SKETCH', user_input: 'test' }),
    });
    return res.status === 429;
  }, record);

  await test('Release blocked when moderation fails', async () => {
    const res = await fetch(`${server.url}/api/forge/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-user': 'user-1', 'x-test-moderation': 'fail' },
      body: JSON.stringify({ generation_id: 'gen-1', tags: ['test'] }),
    });
    return res.status === 403;
  }, record);

  await test('Release blocked when brand similarity is low', async () => {
    const res = await fetch(`${server.url}/api/forge/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-user': 'user-1', 'x-test-similarity': 'low' },
      body: JSON.stringify({ generation_id: 'gen-1', tags: ['test'] }),
    });
    return res.status === 403;
  }, record);

  await test('Event duplicate event_id returns noop', async () => {
    const eventId = crypto.randomUUID();
    const payload = { event_id: eventId, type: 'forge_generate' };
    const headers = { 'Content-Type': 'application/json', 'x-test-user': 'user-1' };
    await fetch(`${server.url}/api/event`, { method: 'POST', headers, body: JSON.stringify(payload) });
    const res = await fetch(`${server.url}/api/event`, { method: 'POST', headers, body: JSON.stringify(payload) });
    const body = await res.json();
    return res.status === 200 && body.noop === true;
  }, record);

  await test('vote_received invalid vote_id returns 403', async () => {
    const res = await fetch(`${server.url}/api/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-user': 'user-1' },
      body: JSON.stringify({ event_id: crypto.randomUUID(), type: 'vote_received', proof: { vote_id: 'missing' } }),
    });
    return res.status === 403;
  }, record);

  await test('share_click cannot be posted directly', async () => {
    const res = await fetch(`${server.url}/api/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-user': 'user-1' },
      body: JSON.stringify({ event_id: crypto.randomUUID(), type: 'share_click' }),
    });
    return res.status === 400;
  }, record);

  await test('Share redirect awards once per token', async () => {
    const token = signShareToken({ actor_user_id: 'user-1', subject_id: 'artifact-1' });
    await fetch(`${server.url}/s/artifact-1?t=${token}`);
    await fetch(`${server.url}/s/artifact-1?t=${token}`);
    return supabaseMock.awardedEvents.size === 1;
  }, record);

  await test('Token stats returns normalized shape and caches', async () => {
    const res1 = await fetch(`${server.url}/api/token-stats?mint=abc`);
    const body1 = await res1.json();
    const res2 = await fetch(`${server.url}/api/token-stats?mint=abc`);
    const body2 = await res2.json();
    const hasShape =
      body1?.stats &&
      typeof body1.stats.priceUsd !== 'undefined' &&
      typeof body1.stats.fdvUsd !== 'undefined';
    return res1.status === 200 && res2.status === 200 && hasShape && fetchCount === 1 && body2.stale === false;
  }, record);

  await test('OG wrapper returns expected meta tags', async () => {
    const res = await fetch(`${server.url}/artifact/artifact-1`);
    const html = await res.text();
    return (
      res.status === 200 &&
      html.includes('og:title') &&
      html.includes('og:image') &&
      html.includes('twitter:card')
    );
  }, record);

  globalThis.fetch = originalFetch;
  await server.close();

  console.log(`\n📊 Results: ${record.passed} passed, ${record.failed} failed\n`);
  process.exit(record.failed > 0 ? 1 : 0);
}

void runTests();
