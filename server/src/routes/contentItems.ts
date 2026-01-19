import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import type { Database } from '../types/supabase';
import { normalizeMatrixMeta } from '../services/promptMatrix/LegacyRecordsHandler';

type SupabaseAdmin = ReturnType<typeof createClient<Database>>;

const DEFAULT_SCORES = {
  novelty: null,
  coherence: null,
  risk: null,
};

function normalizeScores(scores: unknown) {
  if (!scores || typeof scores !== 'object') {
    return DEFAULT_SCORES;
  }
  const normalized = scores as Record<string, unknown>;
  return {
    novelty: typeof normalized.novelty === 'number' ? normalized.novelty : null,
    coherence: typeof normalized.coherence === 'number' ? normalized.coherence : null,
    risk: typeof normalized.risk === 'number' ? normalized.risk : null,
  };
}

export default function createContentItemsRouter(supabaseAdmin?: SupabaseAdmin) {
  const router = Router();
  const client =
    supabaseAdmin ?? createClient<Database>(config.supabase.url, config.supabase.serviceRoleKey);

  router.get('/memes', async (_req, res) => {
    try {
      const { data, error } = await client
        .from('artifacts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, 49);

      if (error) {
        res.status(500).json({ error: 'Failed to load memes' });
        return;
      }

      const normalized = (data ?? []).map((artifact) => ({
        ...artifact,
        // @ts-expect-error - Supabase table types are not fully generated
        matrix_meta: normalizeMatrixMeta(artifact.matrix_meta),
        // @ts-expect-error - Supabase table types are not fully generated
        scores: normalizeScores(artifact.scores),
      }));

      res.status(200).json({ data: normalized });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load memes' });
    }
  });

  router.get('/memes/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await client
        .from('artifacts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        res.status(500).json({ error: 'Failed to load meme' });
        return;
      }

      if (!data) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      res.status(200).json({
        data: {
          ...data,
          // @ts-expect-error - Supabase table types are not fully generated
          matrix_meta: normalizeMatrixMeta(data.matrix_meta),
          // @ts-expect-error - Supabase table types are not fully generated
          scores: normalizeScores(data.scores),
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load meme' });
    }
  });

  return router;
}
