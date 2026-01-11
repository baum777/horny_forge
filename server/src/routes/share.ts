import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { config } from '../config';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { signShareToken, verifySignedShareToken } from '../utils/signing';
import crypto from 'crypto';

export const shareApiRouter = Router();
export const shareRedirectRouter = Router();

const ShareTokenSchema = z.object({
  subject_id: z.string(),
});

const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey);

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
  } catch (error: any) {
    return res.status(500).json({ error: 'token_failed', message: error?.message });
  }
});

shareRedirectRouter.get('/s/:artifactId', async (req, res) => {
  const { artifactId } = req.params;
  const token = typeof req.query.t === 'string' ? req.query.t : undefined;

  if (token) {
    const payload = verifySignedShareToken(token);
    if (payload && payload.subject_id === artifactId) {
      const eventId = crypto.randomUUID();
      await supabaseAdmin.rpc('award_event', {
        p_event_id: eventId,
        p_actor_user_id: payload.actor_user_id,
        p_event_type: 'share_click',
        p_subject_id: artifactId,
        p_source: 'share_redirect',
      });
    }
  }

  return res.redirect(302, `/archives/${artifactId}`);
});
