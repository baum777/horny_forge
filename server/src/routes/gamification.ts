import { Router } from "express";
import type { ActionType, ActionContext } from "../gamification/types";
import { GamificationStoreSupabase } from "../store/gamificationStoreSupabase";
import { applyAction, getRule } from "../gamification/engine";
import { validateAction, checkActionCap } from "../gamification/validation";
import { gamificationActionRateLimit } from "../middleware/rateLimit";
import { logger } from "../utils/logger";
import { metrics } from "../utils/metrics";
import type { AuthenticatedRequest } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";

export const gamificationRouter = Router();

// Initialize store
const store = new GamificationStoreSupabase();

// Get user ID from authenticated request
function getUserId(req: AuthenticatedRequest): string {
  if (!req.userId) {
    throw new Error("Authentication required");
  }
  return req.userId;
}

gamificationRouter.get("/me", async (req, res) => {
  const startTime = Date.now();
  try {
    const userId = getUserId(req as AuthenticatedRequest);
    const nowISO = new Date().toISOString();
    const stats = await store.getOrCreate(userId, nowISO);

    const latency = Date.now() - startTime;
    logger.info("get_user_stats", { userId, latency });
    metrics.observe("gamification_get_stats_latency_ms", latency);

    res.json({ stats });
  } catch (e: any) {
    const latency = Date.now() - startTime;
    logger.error("get_user_stats_failed", { error: e.message, latency });
    res.status(500).json({ error: e.message || "Failed to load stats" });
  }
});

gamificationRouter.post(
  "/action",
  gamificationActionRateLimit,
  requireAuth,
  async (req, res) => {
    const startTime = Date.now();
    const userId = getUserId(req as AuthenticatedRequest);

    const headerIdem = req.header("Idempotency-Key");
    const action = req.body?.action as ActionType;
    const bodyIdem = req.body?.idempotencyKey as string | undefined;
    const idempotencyKey = (headerIdem || bodyIdem || "").trim();

    // Validation: action and idempotency key required
    if (!action) {
      metrics.increment("gamification_actions_total", { action: "unknown", status: "rejected" });
      return res.status(400).json({ error: "Missing action" });
    }
    if (!idempotencyKey) {
      metrics.increment("gamification_actions_total", { action, status: "rejected" });
      return res.status(400).json({ error: "Missing Idempotency-Key" });
    }

    const nowISO = new Date().toISOString();

    try {
      // Step 1: Check idempotency (server truth)
      const wasProcessed = await store.wasProcessed(userId, idempotencyKey);
      if (wasProcessed) {
        const cached = await store.getCachedResponse(userId, idempotencyKey);
        if (cached) {
          const latency = Date.now() - startTime;
          logger.info("action_idempotent_hit", {
            userId,
            action,
            idempotencyKey,
            latency,
          });
          metrics.increment("gamification_idempotency_hits_total");
          metrics.increment("gamification_actions_total", { action, status: "idempotent" });
          return res.json(cached);
        }
        // Fallback: return current stats with zero delta
        const stats = await store.getOrCreate(userId, nowISO);
        const latency = Date.now() - startTime;
        logger.warn("action_idempotent_no_cache", {
          userId,
          action,
          idempotencyKey,
          latency,
        });
        return res.json({
          stats,
          result: {
            deltaHorny: 0,
            newLevel: stats.level,
            visibilityBoost: { level: stats.level, feedWeight: 1.0, features: [] },
            newlyUnlockedBadges: [],
            newlyUnlockedFeatures: [],
            tier: "private",
          },
        });
      }

      // Step 2: Load current stats
      const prev = await store.getOrCreate(userId, nowISO);

      // Step 3: Validate action
      const validation = validateAction(action, req.body, prev, nowISO);
      if (!validation.valid) {
        const latency = Date.now() - startTime;
        logger.warn("action_validation_failed", {
          userId,
          action,
          idempotencyKey,
          reason: validation.reason,
          latency,
        });
        metrics.increment("gamification_actions_total", { action, status: "rejected" });
        metrics.increment("gamification_rejects_total", { reason: validation.reason || "unknown" });

        // Return canonical stats to prevent UI drift
        const stats = await store.getOrCreate(userId, nowISO);
        return res.status(400).json({
          error: validation.reason || "Validation failed",
          stats,
        });
      }

      // Step 4: Check action-specific caps
      const rule = getRule(action);
      const capCheck = checkActionCap(action, prev, rule.hornyCap?.daily, rule.hornyCap?.weekly);
      if (!capCheck.allowed) {
        const latency = Date.now() - startTime;
        logger.warn("action_cap_reached", {
          userId,
          action,
          idempotencyKey,
          reason: capCheck.reason,
          latency,
        });
        metrics.increment("gamification_actions_total", { action, status: "rejected" });
        metrics.increment("gamification_rejects_total", { reason: capCheck.reason || "cap" });

        const stats = await store.getOrCreate(userId, nowISO);
        return res.status(400).json({
          error: capCheck.reason || "Cap reached",
          stats,
        });
      }

      // Step 5: Build action context
      const ctx: ActionContext = {
        nowISO,
        idempotencyKey,
        artifactId: req.body?.artifactId,
        receivedVotesDelta: req.body?.receivedVotesDelta,
        timeDeltaSeconds: req.body?.timeDeltaSeconds,
        quizClassId: req.body?.quizClassId,
        quizVector: req.body?.quizVector,
      };

      // Step 6: Apply action (pure function)
      const { next, result } = applyAction(prev, action, ctx);

      // Step 7: Save with transaction (event ledger + stats update + idempotency)
      const eventId = await store.saveWithTransaction(userId, next, {
        action,
        payload: req.body,
        deltaHorny: result.deltaHorny,
        levelBefore: prev.level,
        levelAfter: next.level,
        capsApplied: {
          dailyCap: rule.hornyCap?.daily,
          weeklyCap: rule.hornyCap?.weekly,
          globalDailyCap: 150,
          globalWeeklyCap: 600,
        },
        badgesUnlocked: result.newlyUnlockedBadges,
        featuresUnlocked: result.newlyUnlockedFeatures,
        status: "applied",
      });

      // Step 8: Mark idempotency with cached response
      const responseCache = { stats: next, result };
      await store.markProcessed(userId, idempotencyKey, action, eventId, responseCache);

      // Step 9: Enqueue payout if delta > 0
      if (result.deltaHorny > 0) {
        const payoutIdemKey = `payout:${eventId}`;
        try {
          await store.enqueuePayout(userId, result.deltaHorny, payoutIdemKey, eventId);
          logger.info("payout_enqueued", {
            userId,
            eventId,
            amount: result.deltaHorny,
          });
        } catch (payoutError: any) {
          // Log but don't fail the request
          logger.error("payout_enqueue_failed", {
            userId,
            eventId,
            error: payoutError.message,
          });
        }
      }

      const latency = Date.now() - startTime;
      logger.info("action_applied", {
        userId,
        action,
        idempotencyKey,
        eventId,
        deltaHorny: result.deltaHorny,
        levelBefore: prev.level,
        levelAfter: next.level,
        latency,
      });

      metrics.increment("gamification_actions_total", { action, status: "applied" });
      metrics.increment("gamification_horny_distributed_total", undefined, result.deltaHorny);
      metrics.observe("gamification_action_latency_ms", latency, { action });

      res.json({ stats: next, result });
    } catch (e: any) {
      const latency = Date.now() - startTime;
      logger.error("action_failed", {
        userId,
        action,
        idempotencyKey,
        error: e.message,
        stack: e.stack,
        latency,
      });

      metrics.increment("gamification_actions_total", { action, status: "error" });

      // Return canonical stats to prevent UI drift
      try {
        const stats = await store.getOrCreate(userId, nowISO);
        res.status(400).json({
          error: e?.message ?? "Unknown error",
          stats,
        });
      } catch (fallbackError: any) {
        res.status(500).json({
          error: e?.message ?? "Unknown error",
          code: "INTERNAL_ERROR",
        });
      }
    }
  }
);

// Metrics endpoint (admin-only in production)
gamificationRouter.get("/metrics", async (req, res) => {
  const allMetrics = metrics.getAllMetrics();
  res.json({
    metrics: allMetrics,
    timestamp: new Date().toISOString(),
  });
});
