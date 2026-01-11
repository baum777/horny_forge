import { Router } from 'express';
import { z } from 'zod';
import { awardEvent } from '../services/gamification/awardEvent';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const EventSchema = z.object({
  event_id: z.string().uuid(),
  type: z.enum([
    'forge_generate',
    'artifact_release',
    'vote_cast',
    'vote_received',
    'daily_return',
  ]),
  subject_id: z.string().optional(),
  source: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  proof: z.record(z.any()).optional(),
});

router.post('/event', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = EventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const actorUserId = req.userId;
  if (!actorUserId) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const result = await awardEvent({
      actorUserId,
      ...parsed.data,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    const status = error?.status ?? 500;
    const code = error?.code ?? 'event_failed';
    return res.status(status).json({ error: code, message: error?.message });
  }
});

export default router;
