import { Router } from "express";
import { GamificationStoreSupabase } from "../store/gamificationStoreSupabase";
import { logger } from "../utils/logger";
import type { AuthenticatedRequest } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";

export const adminRouter = Router();

const store = new GamificationStoreSupabase();

// Simple admin check (replace with proper role-based auth)
function isAdmin(req: AuthenticatedRequest): boolean {
  // TODO: Check admin role from user metadata or allowlist
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(",") || [];
  return req.userId ? adminUserIds.includes(req.userId) : false;
}

adminRouter.use(requireAuth);
adminRouter.use((req, res, next) => {
  if (!isAdmin(req as AuthenticatedRequest)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
});

// Manual adjustment endpoint
adminRouter.post("/adjust", async (req, res) => {
  try {
    const { userId, adjustments } = req.body;

    if (!userId || !adjustments) {
      return res.status(400).json({ error: "userId and adjustments required" });
    }

    const nowISO = new Date().toISOString();
    const stats = await store.getOrCreate(userId, nowISO);

    // Apply adjustments
    const updated = { ...stats };
    if (adjustments.pendingHorny !== undefined) {
      // This would add to a pending balance (not lifetime)
      // For now, we'll log it as a special event
      logger.info("admin_adjustment", {
        adminUserId: (req as AuthenticatedRequest).userId,
        targetUserId: userId,
        adjustment: adjustments,
      });

      // Create a manual adjustment event
      await store.saveWithTransaction(userId, updated, {
        action: "special",
        payload: { type: "admin_adjustment", adjustments },
        deltaHorny: adjustments.pendingHorny || 0,
        levelBefore: stats.level,
        levelAfter: stats.level,
        capsApplied: {},
        badgesUnlocked: [],
        featuresUnlocked: [],
        status: "applied",
      });
    }

    if (adjustments.level !== undefined) {
      updated.level = adjustments.level;
    }

    if (adjustments.revokeBadge) {
      updated.unlockedBadges = updated.unlockedBadges.filter(
        (b) => b !== adjustments.revokeBadge
      );
    }

    if (adjustments.revokeFeature) {
      updated.unlockedFeatures = updated.unlockedFeatures.filter(
        (f) => f !== adjustments.revokeFeature
      );
    }

    await store.save(userId, updated);

    res.json({ success: true, stats: updated });
  } catch (e: any) {
    logger.error("admin_adjustment_failed", { error: e.message });
    res.status(500).json({ error: e.message });
  }
});

// Rebuild stats from events (recovery)
adminRouter.post("/rebuild-stats", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    // TODO: Implement rebuild logic
    // 1. Fetch all events for user
    // 2. Recompute stats from scratch
    // 3. Update user_stats

    logger.info("admin_rebuild_stats", {
      adminUserId: (req as AuthenticatedRequest).userId,
      targetUserId: userId,
    });

    res.json({ success: true, message: "Rebuild not yet implemented" });
  } catch (e: any) {
    logger.error("admin_rebuild_failed", { error: e.message });
    res.status(500).json({ error: e.message });
  }
});

