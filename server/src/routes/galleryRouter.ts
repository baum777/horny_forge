import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { config } from '../config';
import type { Database } from '../types/supabase';
import type { AuthenticatedRequest } from '../middleware/auth';

const rateSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

const EDIT_WINDOW_MS = 15 * 60 * 1000;

export default function createGalleryRouter() {
  const router = Router();
  const client = createClient<Database>(config.supabase.url, config.supabase.serviceRoleKey);

  router.post('/gallery/:artifactId/rate', async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const parseResult = rateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid input', code: 'INVALID_INPUT' });
      return;
    }

    const { artifactId } = req.params;
    const { rating } = parseResult.data;

    const { data: artifact, error: artifactError } = await client
      .from('artifacts')
      .select('id, hidden')
      .eq('id', artifactId)
      .maybeSingle();

    if (artifactError) {
      res.status(500).json({ error: 'Failed to load meme', code: 'DB_FAIL' });
      return;
    }

    if (!artifact) {
      res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
      return;
    }

    if (artifact.hidden) {
      res.status(403).json({ error: 'Meme is hidden', code: 'FORBIDDEN' });
      return;
    }

    const { data: existing, error: existingError } = await client
      .from('meme_ratings')
      .select('id, created_at')
      .eq('artifact_id', artifactId)
      .eq('user_id', authReq.userId)
      .maybeSingle();

    if (existingError) {
      res.status(500).json({ error: 'Failed to load rating', code: 'DB_FAIL' });
      return;
    }

    if (!existing) {
      const { error: insertError } = await client.from('meme_ratings').insert({
        artifact_id: artifactId,
        user_id: authReq.userId,
        rating,
      });

      if (insertError) {
        res.status(500).json({ error: 'Failed to save rating', code: 'DB_FAIL' });
        return;
      }
    } else {
      const createdAt = new Date(existing.created_at);
      if (Number.isNaN(createdAt.getTime()) || Date.now() - createdAt.getTime() > EDIT_WINDOW_MS) {
        res.status(403).json({ error: 'Rating edit window expired', code: 'RATE_LOCKED' });
        return;
      }

      const { error: updateError } = await client
        .from('meme_ratings')
        .update({ rating, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (updateError) {
        res.status(500).json({ error: 'Failed to update rating', code: 'DB_FAIL' });
        return;
      }
    }

    const { data: stats, error: statsError } = await client
      .from('artifacts')
      .select('avg_rating, rating_count')
      .eq('id', artifactId)
      .maybeSingle();

    if (statsError) {
      res.status(500).json({ error: 'Failed to load rating stats', code: 'DB_FAIL' });
      return;
    }

    res.status(200).json({
      ok: true,
      rating,
      avg_rating: stats?.avg_rating ?? null,
      rating_count: stats?.rating_count ?? 0,
    });
  });

  return router;
}

