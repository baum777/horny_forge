// server/src/routes/dashboardRouter.ts
// Dashboard Aggregation Readmodel (Express)
// Aggregates existing /api routers into ONE contract for the UI.
// - Reads: token stats, gamification status, recent rewards (admin/gamification), system notices
// - No mutations here. Keep this endpoint fast + cacheable.

import { Router } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import { getTokenStats } from "../services/tokenStatsService";
import { GamificationStoreSupabase } from "../store/gamificationStoreSupabase";
import { getLevelFromXp } from "../services/gamification/levels";
import { ALL_BADGES } from "../badges/unifiedBadges";
import { config } from "../config";

type Severity = "info" | "warn" | "error";

export type DashboardDTO = {
  user: {
    id: string;
    xHandle?: string;
    avatarUrl?: string;
    status: "anonymous" | "verified" | "cooldown" | "rate_limited";
    level?: number;
    xp?: { current: number; next: number };
    streak?: { days: number; endsAt?: string };
  };
  actions: Array<{
    id: string;
    title: string;
    description: string;
    state: "available" | "cooldown" | "locked" | "completed";
    cooldownEndsAt?: string;
    progress?: { current: number; target: number };
    rewardHint?: string;
  }>;
  badges: {
    earned: Array<{ id: string; name: string; icon: string; earnedAt: string }>;
    locked: Array<{
      id: string;
      name: string;
      icon: string;
      progress?: { current: number; target: number };
    }>;
  };
  rewards: {
    pendingCount: number;
    recent: Array<{
      id: string;
      amountText: string;
      createdAt: string;
      status: "pending" | "paid" | "failed";
    }>;
  };
  token?: {
    symbol?: string;
    holders?: number;
    priceUsd?: number;
    marketCapUsd?: number;
    updatedAt?: string;
  };
  system: {
    lastSyncAt?: string;
    notices: Array<{ id: string; severity: Severity; text: string }>;
  };
};

// --- helpers (keep pure) ---
const nowIso = () => new Date().toISOString();
const safeNumber = (v: any): number | undefined => {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : undefined;
};

function mkNotice(id: string, severity: Severity, text: string) {
  return { id, severity, text };
}

// Initialize store
const store = new GamificationStoreSupabase();

// --- "service adapters" (wired to real services) ---
async function getUserContext(req: AuthenticatedRequest): Promise<{
  id: string;
  xHandle?: string;
  avatarUrl?: string;
  verified: boolean;
  rateLimited?: boolean;
  cooldownEndsAt?: string;
}> {
  const userId = req.userId;
  const userHandle = req.userHandle;
  const userAvatar = req.userAvatar;

  if (!userId) return { id: "anon", verified: false };

  return {
    id: userId,
    xHandle: userHandle,
    avatarUrl: userAvatar,
    verified: true,
    // Rate limiting handled at middleware level (see rateLimit.ts)
    // Cooldowns are action-specific and checked during action validation
    rateLimited: false,
    cooldownEndsAt: undefined,
  };
}

function resolveDefaultMint(): string | null {
  return (
    process.env.TOKEN_MINT ||
    process.env.NEXT_PUBLIC_TOKEN_MINT ||
    process.env.VITE_TOKEN_MINT ||
    null
  );
}

function resolveFallbackPairUrl(): string | null {
  return (
    process.env.DEX_LINK ||
    process.env.NEXT_PUBLIC_DEX_LINK ||
    process.env.VITE_DEX_LINK ||
    null
  );
}

async function fetchTokenStats(): Promise<{
  holders?: number;
  priceUsd?: number;
  marketCapUsd?: number;
  updatedAt?: string;
}> {
  const mint = resolveDefaultMint();
  if (!mint) return { updatedAt: nowIso() };

  try {
    const fallbackPairUrl = resolveFallbackPairUrl();
    const { response } = await getTokenStats({ mint, fallbackPairUrl });
    return {
      holders: response.holders ?? undefined,
      priceUsd: response.stats.priceUsd ?? undefined,
      marketCapUsd: response.stats.fdvUsd ?? undefined,
      updatedAt: response.stats.updatedAt,
    };
  } catch (e) {
    return { updatedAt: nowIso() };
  }
}

function getXpForLevel(level: number): number {
  // Level thresholds from LEVEL_THRESHOLDS
  const thresholds = [
    { level: 1, xp: 0 },
    { level: 2, xp: 10 },
    { level: 3, xp: 30 },
    { level: 4, xp: 70 },
    { level: 5, xp: 130 },
    { level: 6, xp: 220 },
    { level: 7, xp: 350 },
    { level: 8, xp: 520 },
    { level: 9, xp: 750 },
    { level: 10, xp: 1050 },
  ];
  return thresholds.find((t) => t.level === level)?.xp ?? 0;
}

async function fetchGamificationState(userId: string): Promise<{
  level?: number;
  xp?: { current: number; next: number };
  streak?: { days: number; endsAt?: string };
  badgesEarned?: Array<{ id: string; name: string; icon: string; earnedAt: string }>;
  badgesLocked?: Array<{ id: string; name: string; icon: string; progress?: { current: number; target: number } }>;
  actionStates?: Record<
    string,
    { state: "available" | "cooldown" | "locked" | "completed"; cooldownEndsAt?: string; progress?: { current: number; target: number } }
  >;
}> {
  if (userId === "anon") {
    return {
      level: 0,
      xp: { current: 0, next: 50 },
      streak: { days: 0 },
      badgesEarned: [],
      badgesLocked: [],
      actionStates: {},
    };
  }

  try {
    const nowISO = nowIso();
    const stats = await store.getOrCreate(userId, nowISO);

    const level = stats.level;
    const xpCurrent = stats.lifetimeHornyEarned;
    const xpNext = getXpForLevel(level + 1);

    // Map unlocked badges to earned badges
    const badgesEarned = stats.unlockedBadges.map((badgeId) => {
      const badge = ALL_BADGES.find((b) => b.id === badgeId);
      return {
        id: badgeId,
        name: badge?.name ?? badgeId,
        icon: badge?.emoji ?? "🏅",
        earnedAt: stats.lastActiveISO ?? nowISO,
      };
    });

    // Map locked badges with progress
    const badgesLocked = ALL_BADGES.filter((b) => !stats.unlockedBadges.includes(b.id)).map((badge) => {
      // Calculate progress based on unlock condition
      let progress: { current: number; target: number } | undefined;
      if (badge.unlockCondition.type === "action_count") {
        const current = stats.counts[badge.unlockCondition.action] ?? 0;
        progress = { current, target: badge.unlockCondition.count };
      } else if (badge.unlockCondition.type === "streak") {
        progress = { current: stats.currentStreak, target: badge.unlockCondition.days };
      }

      return {
        id: badge.id,
        name: badge.name,
        icon: badge.emoji ?? "🔒",
        progress,
      };
    });

    return {
      level,
      xp: { current: xpCurrent, next: xpNext },
      streak: { days: stats.currentStreak },
      badgesEarned,
      badgesLocked,
      // Action states (cooldowns, progress) can be derived from user stats if needed
      // For now, actions use default states based on verification status
      actionStates: {},
    };
  } catch (e) {
    return {
      level: 0,
      xp: { current: 0, next: 50 },
      streak: { days: 0 },
      badgesEarned: [],
      badgesLocked: [],
      actionStates: {},
    };
  }
}

async function fetchRewardsSnapshot(userId: string): Promise<{
  pendingCount: number;
  recent: Array<{ id: string; amountText: string; createdAt: string; status: "pending" | "paid" | "failed" }>;
}> {
  if (userId === "anon") return { pendingCount: 0, recent: [] };

  try {
    // TODO: Query payout_jobs table from Supabase
    // Example: SELECT COUNT(*) WHERE user_id = $1 AND status = 'pending'
    //          SELECT * WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10
    return { pendingCount: 0, recent: [] };
  } catch (e) {
    return { pendingCount: 0, recent: [] };
  }
}

// --- Actions catalogue (UI-facing) ---
// Keep this list stable (IDs used by frontend). Backend only fills state/progress/cooldowns.
const ACTIONS_CATALOGUE: Array<{
  id: string;
  title: string;
  description: string;
  rewardHint?: string;
  requiresVerified?: boolean;
}> = [
  {
    id: "verify_x",
    title: "Verify with X",
    description: "Connect your X account to unlock actions.",
    rewardHint: "Unlock quests",
    requiresVerified: false,
  },
  {
    id: "daily_checkin",
    title: "Daily check-in",
    description: "Keep your streak alive.",
    rewardHint: "XP + streak",
    requiresVerified: true,
  },
  {
    id: "share_post",
    title: "Share a post",
    description: "Spread the signal. Proof via X.",
    rewardHint: "Badge progress",
    requiresVerified: true,
  },
  {
    id: "forge_event",
    title: "Forge an event",
    description: "Create a signal event (server-verified).",
    rewardHint: "XP + badge",
    requiresVerified: true,
  },
];

function buildActions(
  verified: boolean,
  actionStates?: Awaited<ReturnType<typeof fetchGamificationState>>["actionStates"]
): DashboardDTO["actions"] {
  return ACTIONS_CATALOGUE.map((a) => {
    // default state
    let state: DashboardDTO["actions"][number]["state"] = "available";
    let cooldownEndsAt: string | undefined;
    let progress: { current: number; target: number } | undefined;

    if (a.requiresVerified && !verified) state = "locked";
    if (a.id === "verify_x" && verified) state = "completed";

    // overlay gamification service truth if present
    const s = actionStates?.[a.id];
    if (s) {
      state = s.state;
      cooldownEndsAt = s.cooldownEndsAt;
      progress = s.progress;
    }

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      rewardHint: a.rewardHint,
      state,
      cooldownEndsAt,
      progress,
    };
  });
}

function deriveUserStatus(ctx: Awaited<ReturnType<typeof getUserContext>>): DashboardDTO["user"]["status"] {
  if (!ctx.verified) return "anonymous";
  if (ctx.rateLimited) return "rate_limited";
  if (ctx.cooldownEndsAt) return "cooldown";
  return "verified";
}

export const dashboardRouter = Router();

dashboardRouter.get("/dashboard", async (req, res) => {
  const t0 = Date.now();
  const notices: DashboardDTO["system"]["notices"] = [];

  try {
    const userCtx = await getUserContext(req as AuthenticatedRequest);
    const status = deriveUserStatus(userCtx);

    // Parallel fetches (keep under strict time budget)
    const [tokenStats, gamification, rewards] = await Promise.all([
      fetchTokenStats().catch(() => ({ updatedAt: nowIso() })),
      fetchGamificationState(userCtx.id).catch(() => ({
        level: 0,
        xp: { current: 0, next: 50 },
        streak: { days: 0 },
        badgesEarned: [],
        badgesLocked: [],
        actionStates: {},
      })),
      fetchRewardsSnapshot(userCtx.id).catch(() => ({ pendingCount: 0, recent: [] })),
    ]);

    // Derived notices
    if (status === "anonymous") notices.push(mkNotice("verify", "info", "Verify with X to unlock the full loop."));
    if (status === "rate_limited") notices.push(mkNotice("rate", "warn", "Rate limited — try again later."));
    if (status === "cooldown") notices.push(mkNotice("cooldown", "info", "Cooldown active — some actions are temporarily disabled."));

    // Contract fill
    const dto: DashboardDTO = {
      user: {
        id: userCtx.id,
        xHandle: userCtx.xHandle,
        avatarUrl: userCtx.avatarUrl,
        status,
        level: gamification.level ?? 0,
        xp: gamification.xp ?? { current: 0, next: 0 },
        streak: gamification.streak ?? { days: 0 },
      },
      actions: buildActions(userCtx.verified, gamification.actionStates),
      badges: {
        earned: gamification.badgesEarned ?? [],
        locked: gamification.badgesLocked ?? [],
      },
      rewards: rewards,
      token: {
        symbol: process.env.TOKEN_SYMBOL ?? undefined,
        holders: tokenStats.holders,
        priceUsd: tokenStats.priceUsd,
        marketCapUsd: tokenStats.marketCapUsd,
        updatedAt: tokenStats.updatedAt,
      },
      system: {
        lastSyncAt: nowIso(),
        notices,
      },
    };

    // Optional: lightweight performance hint for debugging (strip in prod if you want)
    res.setHeader("x-dashboard-ms", String(Date.now() - t0));
    res.json(dto);
  } catch (e: any) {
    res.status(500).json({
      error: "dashboard_readmodel_failed",
      message: e?.message ?? "Unknown error",
      system: { lastSyncAt: nowIso(), notices: [mkNotice("err", "error", "Dashboard failed to load.")] },
    });
  }
});

export default dashboardRouter;
