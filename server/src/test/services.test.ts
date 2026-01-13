import { describe, expect, it, vi } from 'vitest';
import { ForgeService } from '../services/ForgeService';
import { ReleaseService } from '../services/ReleaseService';

type SupabaseMockConfig = {
  userStatsResult?: { data: any; error: any };
  previewSelectResult?: { data: any; error: any };
  previewUpdateError?: any;
  artifactsInsertResponse?: { data: any; error: any };
  rpcRemaining?: number;
};

function createSupabaseMock(config: SupabaseMockConfig = {}) {
  const userStatsMaybeSingle = vi.fn(() =>
    Promise.resolve(config.userStatsResult ?? { data: null, error: null }),
  );
  const userStatsEq = vi.fn(() => ({ maybeSingle: userStatsMaybeSingle }));
  const userStatsSelect = vi.fn(() => ({ eq: userStatsEq }));
  const userStatsInsert = vi.fn(() => Promise.resolve({ error: null }));

  const previewMaybeSingle = vi.fn(() =>
    Promise.resolve(config.previewSelectResult ?? { data: null, error: null }),
  );
  const previewEq = vi.fn(() => ({ maybeSingle: previewMaybeSingle }));
  const previewSelect = vi.fn(() => ({ eq: previewEq }));
  const previewInsert = vi.fn(() => Promise.resolve({ error: null }));
  const previewEqForUpdate = vi.fn(() => Promise.resolve({ error: config.previewUpdateError ?? null }));
  const previewUpdate = vi.fn(() => ({ eq: previewEqForUpdate }));

  const artifactSingle = vi.fn(() =>
    Promise.resolve(config.artifactsInsertResponse ?? { data: { id: 'artifact-1', image_url: 'https://art', tags: [] }, error: null }),
  );
  const artifactSelect = vi.fn(() => ({ single: artifactSingle }));
  const artifactInsert = vi.fn(() => ({ select: artifactSelect }));

  const fromMock = vi.fn((table: string) => {
    if (table === 'user_stats') return { select: userStatsSelect, insert: userStatsInsert };
    if (table === 'forge_previews') return { select: previewSelect, insert: previewInsert, update: previewUpdate };
    if (table === 'artifacts') return { insert: artifactInsert };
    throw new Error(`Unexpected table ${table}`);
  });

  const rpc = vi.fn(() =>
    Promise.resolve({ data: { allowed: true, remaining: config.rpcRemaining ?? 0 }, error: null }),
  );

  return { from: fromMock, rpc };
}

describe('ForgeService', () => {
  it('creates a preview when quota and moderation pass', async () => {
    const supabase = createSupabaseMock();
    const imageGen = { generate: vi.fn(() => Promise.resolve({ imageBytes: Buffer.from('data'), modelMeta: { model: 'test', size: '1024x1024' } })) };
    const storage = { storePreview: vi.fn(() => Promise.resolve({ previewUrl: 'https://preview', generationId: 'gen-1' })) };
    const moderation = { moderateText: vi.fn(() => Promise.resolve({ status: 'pass', reasons: { flagged: false, categories: {}, scores: {} } })) };

    const service = new ForgeService({
      supabase: supabase as any,
      imageGen: imageGen as any,
      storage: storage as any,
      moderation: moderation as any,
    });

    const result = await service.createPreview('user-1', {
      baseId: 'base-01',
      templateId: 'HORNY_CORE_SKETCH',
      input: 'test input',
    });

    expect(result.generationId).toBe('gen-1');
    expect(result.previewUrl).toBe('https://preview');
    expect(result.quota.remaining).toBe(0);
    expect(storage.storePreview).toHaveBeenCalled();
    expect(moderation.moderateText).toHaveBeenCalled();
  });
});

describe('ReleaseService', () => {
  it('releases an artifact when similarity passes', async () => {
    const supabase = createSupabaseMock({
      userStatsResult: { data: { level: 2, xp_total: 42 }, error: null },
      previewSelectResult: { data: { generation_id: 'gen-1', moderation_status: 'pass', moderation_reasons: {} }, error: null },
      artifactsInsertResponse: { data: { id: 'artifact-1', image_url: 'https://art', tags: [] }, error: null },
    });
    const storage = {
      getPreviewBytes: vi.fn(() => Promise.resolve(Buffer.from('bytes'))),
      releaseArtifact: vi.fn(() => Promise.resolve({ artifactId: 'artifact-1', imageUrl: 'https://art' })),
    };
    const similarity = { compareToBase: vi.fn(() => Promise.resolve({ similarity: 0.9, baseMatchId: 'base-01', distance: 10 })) };

    const service = new ReleaseService({
      supabase: supabase as any,
      storage: storage as any,
      similarity: similarity as any,
    });

    const response = await service.finalizeRelease(
      'user-1',
      { generationId: 'gen-1', caption: 'hello' },
      { handle: 'user', avatar: 'avatar' },
    );

    expect(response.artifactId).toBe('artifact-1');
    expect(response.safety.status).toBe('passed');
    expect(response.xp.level).toBe(2);
    expect(storage.getPreviewBytes).toHaveBeenCalledWith('gen-1');
    expect(similarity.compareToBase).toHaveBeenCalled();
  });
});

