import { beforeAll, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import request from 'supertest';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import {
  createMockSupabase,
  createTestAuthMiddleware,
  createTestSession,
  createTestState,
  insertArtifact,
} from '../../test/helpers';

type ForgeControllerType = import('../controllers/ForgeController').ForgeController;

class MockForgeController {
  async forge(_req: AuthenticatedRequest, res: Response) {
    res.status(200).json({ ok: true });
  }

  async release(_req: AuthenticatedRequest, res: Response) {
    res.status(200).json({ ok: true });
  }
}

async function createForgeControllerWithMocks() {
  const { ForgeController } = await import('../controllers/ForgeController');
  const controller = new ForgeController();
  const controllerAny = controller as unknown as {
    getUserLevel: (userId: string) => Promise<number>;
    checkQuota: (params: { userId: string; key: string; limit: number }) => Promise<{ allowed: boolean; remaining: number }>;
    imageGen: { generate: ReturnType<typeof vi.fn> };
    storage: { storePreview: ReturnType<typeof vi.fn> };
    supabase: { from: (table: string) => { insert: ReturnType<typeof vi.fn> } };
    telemetry: { record: ReturnType<typeof vi.fn> };
  };

  let generationCounter = 0;
  controllerAny.getUserLevel = vi.fn().mockResolvedValue(3);
  controllerAny.checkQuota = vi.fn().mockResolvedValue({ allowed: true, remaining: 5 });
  controllerAny.imageGen = {
    generate: vi.fn().mockResolvedValue({
      imageBytes: Buffer.from('preview'),
      modelMeta: { model: 'mock-model', size: '1024x1024' },
    }),
  };
  controllerAny.storage = {
    storePreview: vi.fn().mockImplementation(async () => {
      generationCounter += 1;
      return {
        generationId: `gen-${generationCounter}`,
        previewUrl: `https://cdn.example.com/preview-${generationCounter}.png`,
      };
    }),
  };
  controllerAny.supabase = {
    from: (_table: string) => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  };
  controllerAny.telemetry = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  return controller;
}

describe('forge integration', () => {
  beforeAll(() => {
    process.env.SUPABASE_URL = 'http://localhost:54321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.BASE_IMAGES_PATH = path.resolve(__dirname, '../../public/horny_base');
  });

  it('returns composer fallback metadata when composer throws', async () => {
    const { createApp } = await import('../app');
    const forgeController = await createForgeControllerWithMocks();
    const composer = (forgeController as unknown as { promptComposer: { buildPrompt: () => void } }).promptComposer;
    vi.spyOn(composer, 'buildPrompt').mockImplementation(() => {
      throw new Error('composer crash');
    });

    const app = await createApp({
      forgeController,
      authMiddleware: createTestAuthMiddleware(),
    });

    const session = createTestSession('user-1');
    const res = await request(app)
      .post('/api/forge/preview')
      .set(session.headers)
      .send({
        base_id: 'base-01',
        preset: 'HORNY_CORE_SKETCH',
        user_input: 'test prompt',
        preview_request_id: 'req-1',
      });

    expect(res.status).toBe(200);
    expect(res.body.matrix_meta.fallback_used).toBe(true);
    expect(res.body.matrix_meta.fallback_stage).toBe('composer');
    expect(res.body.matrix_meta.used_guardrails).toContain('COMPOSER_FALLBACK');
  }, 15000);

  it('dedupes matrix_preview_created telemetry per preview_request_id', async () => {
    const { createApp } = await import('../app');
    const { clearRequestTracking } = await import('../services/promptMatrix/TelemetryService');
    const forgeController = await createForgeControllerWithMocks();
    const recordSpy = vi.spyOn((forgeController as unknown as { telemetry: { record: () => Promise<void> } }).telemetry, 'record')
      .mockResolvedValue();

    const app = await createApp({
      forgeController,
      authMiddleware: createTestAuthMiddleware(),
    });

    const session = createTestSession('user-2');
    const previewRequestId = 'preview-req-123';

    const firstResponse = await request(app)
      .post('/api/forge/preview')
      .set(session.headers)
      .send({
        base_id: 'base-01',
        preset: 'HORNY_CORE_SKETCH',
        user_input: 'neon doodle',
        preview_request_id: previewRequestId,
      });
    expect(firstResponse.body.preview_request_id).toBe(previewRequestId);

    await request(app)
      .post('/api/forge/preview')
      .set(session.headers)
      .send({
        base_id: 'base-01',
        preset: 'HORNY_CORE_SKETCH',
        user_input: 'neon doodle',
        preview_request_id: previewRequestId,
      });

    await request(app)
      .post('/api/forge/preview')
      .set(session.headers)
      .send({
        base_id: 'base-01',
        preset: 'HORNY_CORE_SKETCH',
        user_input: 'neon doodle',
        preview_request_id: previewRequestId,
      });

    const previewEvents = recordSpy.mock.calls.filter(([payload]) => payload.event_type === 'matrix_preview_created');
    expect(previewEvents).toHaveLength(1);
    clearRequestTracking(previewRequestId);
  }, 15000);

  it('allows provocative input in preview', async () => {
    const { createApp } = await import('../app');
    const forgeController = await createForgeControllerWithMocks();
    const app = await createApp({
      forgeController,
      authMiddleware: createTestAuthMiddleware(),
    });

    const session = createTestSession('user-3');
    const res = await request(app)
      .post('/api/forge')
      .set(session.headers)
      .send({
        base_id: 'base-01',
        preset: 'HORNY_CORE_SKETCH',
        user_input: 'nsfw chaotic meme idea',
      });

    expect(res.status).toBe(200);
  });

  it('sanitizes PII terms in input', async () => {
    const { createApp } = await import('../app');
    const forgeController = await createForgeControllerWithMocks();
    const app = await createApp({
      forgeController,
      authMiddleware: createTestAuthMiddleware(),
    });

    const session = createTestSession('user-4');
    const res = await request(app)
      .post('/api/forge')
      .set(session.headers)
      .send({
        base_id: 'base-01',
        preset: 'HORNY_CORE_SKETCH',
        user_input: 'email phone address',
      });

    expect(res.status).toBe(200);
    expect(res.body.sanitized_input).toContain('redacted');
    expect(res.body.sanitized_input).not.toContain('email');
  });

  it('rejects technically empty input', async () => {
    const { createApp } = await import('../app');
    const forgeController = await createForgeControllerWithMocks();
    const app = await createApp({
      forgeController,
      authMiddleware: createTestAuthMiddleware(),
    });

    const session = createTestSession('user-5');
    const res = await request(app)
      .post('/api/forge')
      .set(session.headers)
      .send({
        base_id: 'base-01',
        preset: 'HORNY_CORE_SKETCH',
        user_input: '   ',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PROMPT_REJECTED');
  });

  it('returns legacy defaults for missing matrix_meta', async () => {
    const state = createTestState();
    insertArtifact(state, {
      id: 'artifact-legacy',
      caption: 'Legacy Meme',
      author_handle: 'tester',
      image_url: 'https://cdn.example.com/legacy.png',
      matrix_meta: null,
      scores: null,
    });
    const supabaseMock = createMockSupabase(state);

    const { createApp } = await import('../app');
    const app = await createApp({
      forgeController: new MockForgeController() as unknown as ForgeControllerType,
      authMiddleware: createTestAuthMiddleware(),
      supabaseAdmin: supabaseMock as unknown as ReturnType<typeof createMockSupabase>,
    });

    const res = await request(app).get('/api/memes/artifact-legacy');
    expect(res.status).toBe(200);
    expect(res.body.data.matrix_meta.schema_version).toBe('legacy');
    expect(res.body.data.matrix_meta.fallback_used).toBe(true);
    expect(res.body.data.matrix_meta.used_guardrails).toContain('LEGACY_RECORD_DEFAULT');
    expect(res.body.data.scores.novelty).toBeNull();
    expect(res.body.data.scores.coherence).toBeNull();
    expect(res.body.data.scores.risk).toBeNull();
  });
});
