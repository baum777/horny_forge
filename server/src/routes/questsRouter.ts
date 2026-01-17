import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { QuestService } from '../services/quests/QuestService';

const claimSchema = z.object({
  tier: z.number().int().min(1).max(4),
});

export default function createQuestsRouter() {
  const router = Router();
  const questService = new QuestService();

  router.get('/quests/progress', requireAuth, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
        return;
      }
      const progress = await questService.getProgress(userId);
      res.status(200).json(progress);
    } catch (error: unknown) {
      res.status(500).json({ error: 'Failed to load quest progress', code: 'DB_FAIL' });
    }
  });

  router.post('/quests/claim', requireAuth, async (req, res) => {
    const parsed = claimSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid input', code: 'INVALID_INPUT' });
      return;
    }

    try {
      const userId = (req as AuthenticatedRequest).userId;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
        return;
      }

      const result = await questService.claimTier(userId, parsed.data.tier);
      res.status(200).json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Claim failed';
      const codeMap: Record<string, { status: number; code: string }> = {
        'Tier locked': { status: 403, code: 'LOCKED' },
        'Already claimed': { status: 409, code: 'ALREADY_CLAIMED' },
        'Not eligible': { status: 403, code: 'NOT_ELIGIBLE' },
        'pool_empty': { status: 409, code: 'POOL_EMPTY' },
        'Weekly cap exceeded': { status: 403, code: 'WEEKLY_CAP' },
      };
      const mapping = codeMap[message] ?? { status: 500, code: 'CLAIM_FAILED' };
      res.status(mapping.status).json({ error: message, code: mapping.code });
    }
  });

  return router;
}

