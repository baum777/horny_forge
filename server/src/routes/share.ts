import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { config } from '../config';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { signShareToken, verifySignedShareToken } from '../utils/signing';
import crypto from 'crypto';
import type { Database } from '../types/supabase';

type SupabaseAdmin = ReturnType<typeof createClient<Database>>;

const ShareTokenSchema = z.object({
  subject_id: z.string(),
});

function createShareEventId(token: string, artifactId: string) {
  const hash = crypto.createHash('sha256').update(`${token}:${artifactId}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(
    17,
    20
  )}-${hash.slice(20, 32)}`;
}

export function createShareRouters(supabaseAdmin?: SupabaseAdmin) {
  const shareApiRouter = Router();
  const shareRedirectRouter = Router();
  const client =
    supabaseAdmin ?? createClient<Database>(config.supabase.url, config.supabase.serviceRoleKey);

  shareApiRouter.post('/share-token', requireAuth, async (req: AuthenticatedRequest, res) => {
    const parsed = ShareTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    }

    const actorUserId = req.userId;
    if (!actorUserId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    try {
      const token = signShareToken({
        actor_user_id: actorUserId,
        subject_id: parsed.data.subject_id,
      });
      return res.status(200).json({ token });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'token_failed', message });
    }
  });

  shareRedirectRouter.get('/s/:artifactId', async (req, res) => {
    const { artifactId } = req.params;
    const token = typeof req.query.t === 'string' ? req.query.t : undefined;

    if (token) {
      const payload = verifySignedShareToken(token);
      if (payload && payload.subject_id === artifactId) {
        const eventId = createShareEventId(token, artifactId);
        await client.rpc('award_event', {
          p_event_id: eventId,
          p_actor_user_id: payload.actor_user_id,
          p_event_type: 'share_click',
          p_subject_id: artifactId,
          p_source: 'share_redirect',
        });
      }
    }

    return res.redirect(302, `/artifact/${artifactId}`);
  });

  return { shareApiRouter, shareRedirectRouter };
}

export const { shareApiRouter, shareRedirectRouter } = createShareRouters();
