// server/src/routes/badgesRouter.ts
// Badges Aggregation Readmodel (Collection + Progress)
// Aggregates badge data from gamification service

import { Router } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import { GamificationStoreSupabase } from "../store/gamificationStoreSupabase";
import { ALL_BADGES, checkUnlockCondition } from "../badges/unifiedBadges";
import { getBadgeIconUrl, getBadgeFallbackIconUrl } from "../utils/badgeAssets";

type Severity = "info" | "warn" | "error";

export type BadgesDTO = {
  user: { status: "anonymous" | "verified" | "cooldown" | "rate_limited" };
  earned: Array<{
    id: string;
    name: string;
    icon: string;
    rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
    earnedAt: string;
    description?: string;
  }>;
  locked: Array<{
    id: string;
    name: string;
    icon: string;
    rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
    description?: string;
    progress?: { current: number; target: number };
    hints?: string[];
  }>;
  categories?: Array<{ id: string; name: string; badgeIds: string[] }>;
  system: { notices: Array<{ id: string; severity: Severity; text: string }> };
};

// Initialize store
const store = new GamificationStoreSupabase();

// Get user context from authenticated request
async function getUserCtx(req: AuthenticatedRequest): Promise<{ userId: string; verified: boolean }> {
  const userId = req.userId;
  if (!userId) return { userId: "anon", verified: false };
  return { userId, verified: true };
}

function notice(id: string, severity: Severity, text: string) {
  return { id, severity, text };
}

// Map badge unlock conditions to user-friendly hints
function getBadgeHints(unlockCondition: typeof ALL_BADGES[number]["unlockCondition"]): string[] {
  switch (unlockCondition.type) {
    case "action_count":
      return [`Complete ${unlockCondition.count} ${unlockCondition.action} action${unlockCondition.count > 1 ? "s" : ""}`];
    case "streak":
      return [`Maintain a ${unlockCondition.days}-day streak`, "Daily check-in counts"];
    case "quiz_class":
      return [`Complete quiz with class: ${unlockCondition.classId}`];
    case "quiz_score":
      return [`Achieve ${unlockCondition.dimension} score >= ${unlockCondition.min}`];
    case "milestone":
      return [`Reach ${unlockCondition.value} ${unlockCondition.metric}`];
    case "time_spent":
      return [`Spend ${Math.floor(unlockCondition.seconds / 60)} minutes`];
    case "votes_received":
      return [`Receive ${unlockCondition.count} vote${unlockCondition.count > 1 ? "s" : ""}`];
    default:
      return [];
  }
}

// Determine rarity based on badge unlock condition complexity
function getBadgeRarity(unlockCondition: typeof ALL_BADGES[number]["unlockCondition"]): BadgesDTO["earned"][number]["rarity"] {
  switch (unlockCondition.type) {
    case "action_count":
      return unlockCondition.count === 1 ? "common" : unlockCondition.count <= 3 ? "uncommon" : "rare";
    case "streak":
      return unlockCondition.days <= 3 ? "common" : unlockCondition.days <= 7 ? "uncommon" : "rare";
    case "quiz_score":
      return "uncommon";
    case "milestone":
      return "rare";
    default:
      return "common";
  }
}

// Fetch badges from gamification service
async function fetchBadgesFromGamification(userId: string): Promise<{
  earned: BadgesDTO["earned"];
  locked: BadgesDTO["locked"];
  categories?: BadgesDTO["categories"];
}> {
  if (userId === "anon") {
    return {
      earned: [],
      locked: ALL_BADGES.map((badge) => {
        const rarity = getBadgeRarity(badge.unlockCondition);
        return {
          id: badge.id,
          name: badge.name,
          icon: getBadgeIconUrl(badge.id.toLowerCase(), rarity),
          rarity,
          description: badge.description,
          progress: badge.unlockCondition.type === "action_count"
            ? { current: 0, target: badge.unlockCondition.count }
            : badge.unlockCondition.type === "streak"
              ? { current: 0, target: badge.unlockCondition.days }
              : undefined,
          hints: getBadgeHints(badge.unlockCondition),
        };
      }),
      categories: [
        { id: "onboarding", name: "Onboarding", badgeIds: ALL_BADGES.slice(0, 3).map((b) => b.id) },
        { id: "social", name: "Social", badgeIds: ALL_BADGES.slice(3).map((b) => b.id) },
      ],
    };
  }

  try {
    const nowISO = new Date().toISOString();
    const stats = await store.getOrCreate(userId, nowISO);

    // Map earned badges
    const earned: BadgesDTO["earned"] = stats.unlockedBadges.map((badgeId) => {
      const badge = ALL_BADGES.find((b) => b.id === badgeId);
      const rarity = badge ? getBadgeRarity(badge.unlockCondition) : undefined;
      return {
        id: badgeId,
        name: badge?.name ?? badgeId,
        icon: badge ? getBadgeIconUrl(badgeId.toLowerCase(), rarity) : getBadgeFallbackIconUrl(),
        rarity,
        earnedAt: stats.lastActiveISO ?? nowISO,
        description: badge?.description,
      };
    });

    // Map locked badges with progress
    const locked: BadgesDTO["locked"] = ALL_BADGES.filter((b) => !stats.unlockedBadges.includes(b.id)).map((badge) => {
      // Calculate progress based on unlock condition
      let progress: { current: number; target: number } | undefined;
      switch (badge.unlockCondition.type) {
        case "action_count":
          progress = {
            current: stats.counts[badge.unlockCondition.action] ?? 0,
            target: badge.unlockCondition.count,
          };
          break;
        case "streak":
          progress = {
            current: stats.currentStreak,
            target: badge.unlockCondition.days,
          };
          break;
        case "quiz_score": {
          const score =
            badge.unlockCondition.dimension === "degen"
              ? stats.degen
              : badge.unlockCondition.dimension === "horny"
                ? stats.horny
                : badge.unlockCondition.dimension === "conviction"
                  ? stats.conviction
                  : undefined;
          if (score !== undefined) {
            progress = { current: score, target: badge.unlockCondition.min };
          }
          break;
        }
        case "milestone":
          progress = {
            current: stats.counts[badge.unlockCondition.metric] ?? 0,
            target: badge.unlockCondition.value,
          };
          break;
        case "time_spent":
          progress = {
            current: stats.totalTimeSeconds,
            target: badge.unlockCondition.seconds,
          };
          break;
        case "votes_received":
          progress = {
            current: stats.totalVotesReceived,
            target: badge.unlockCondition.count,
          };
          break;
      }

      const rarity = getBadgeRarity(badge.unlockCondition);
      return {
        id: badge.id,
        name: badge.name,
        icon: getBadgeIconUrl(badge.id.toLowerCase(), rarity),
        rarity,
        description: badge.description,
        progress,
        hints: getBadgeHints(badge.unlockCondition),
      };
    });

    // Group badges into categories
    const categories: BadgesDTO["categories"] = [
      {
        id: "onboarding",
        name: "Onboarding",
        badgeIds: ALL_BADGES.filter((b) =>
          b.unlockCondition.type === "action_count" && b.unlockCondition.count === 1
        ).map((b) => b.id),
      },
      {
        id: "social",
        name: "Social",
        badgeIds: ALL_BADGES.filter((b) =>
          ["share", "comment", "vote"].some((action) =>
            b.unlockCondition.type === "action_count" && b.unlockCondition.action === action
          )
        ).map((b) => b.id),
      },
    ];

    return { earned, locked, categories };
  } catch (e) {
    // Fallback to empty state
    return {
      earned: [],
      locked: ALL_BADGES.map((badge) => {
        const rarity = getBadgeRarity(badge.unlockCondition);
        return {
          id: badge.id,
          name: badge.name,
          icon: getBadgeIconUrl(badge.id.toLowerCase(), rarity),
          rarity,
          description: badge.description,
          hints: getBadgeHints(badge.unlockCondition),
        };
      }),
    };
  }
}

const badgesRouter = Router();

badgesRouter.get("/badges", async (req, res) => {
  try {
    const ctx = await getUserCtx(req as AuthenticatedRequest);

    const userStatus: BadgesDTO["user"]["status"] = ctx.verified ? "verified" : "anonymous";

    const systemNotices: BadgesDTO["system"]["notices"] = [];
    if (!ctx.verified) {
      systemNotices.push(notice("verify", "info", "Verify with X to unlock badge progress."));
    }

    const { earned, locked, categories } = await fetchBadgesFromGamification(ctx.userId);

    const dto: BadgesDTO = {
      user: { status: userStatus },
      earned,
      locked,
      categories,
      system: { notices: systemNotices },
    };

    res.json(dto);
  } catch (e: any) {
    res.status(500).json({
      error: "badges_readmodel_failed",
      message: e?.message ?? "Unknown error",
      system: { notices: [notice("err", "error", "Badges failed to load.")] },
    });
  }
});

// Optional detail endpoint (for modal/page later)
badgesRouter.get("/badges/:id", async (req, res) => {
  try {
    const ctx = await getUserCtx(req as AuthenticatedRequest);
    const { earned, locked } = await fetchBadgesFromGamification(ctx.userId);

    const all = [...earned, ...locked];
    const badge = all.find((b) => b.id === req.params.id);

    if (!badge) {
      return res.status(404).json({ error: "badge_not_found" });
    }

    res.json({ badge });
  } catch (e: any) {
    res.status(500).json({
      error: "badge_detail_failed",
      message: e?.message ?? "Unknown error",
    });
  }
});

export default badgesRouter;

