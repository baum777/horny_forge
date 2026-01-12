// server/src/routes/actionsRouter.ts
// Actions Aggregation Readmodel (Quest Board)
// Maps backend concepts (events, share, gamification) to UI-facing actions

import { Router } from "express";
import crypto from "crypto";
import type { AuthenticatedRequest } from "../middleware/auth";

type Severity = "info" | "warn" | "error";

export type ActionsDTO = {
  user: { status: "anonymous" | "verified" | "cooldown" | "rate_limited" };
  actions: Array<{
    id: string;
    title: string;
    description: string;
    category: "daily" | "social" | "event" | "progression";
    state: "available" | "cooldown" | "locked" | "completed";
    cooldownEndsAt?: string;
    progress?: { current: number; target: number };
    rewardHint?: string;
    cta:
      | { type: "verify_x"; label: string }
      | { type: "open_url"; label: string; url: string }
      | { type: "call_api"; label: string; method: "POST"; path: string; body?: unknown }
      | { type: "disabled"; label: string; reason?: string };
  }>;
  system: { notices: Array<{ id: string; severity: Severity; text: string }> };
};

// Get user context from authenticated request
async function getUserCtx(req: AuthenticatedRequest): Promise<{
  verified: boolean;
  rateLimited?: boolean;
  cooldownEndsAt?: string;
}> {
  const userId = req.userId;
  if (!userId) return { verified: false };

  return {
    verified: true,
    // Rate limiting handled at middleware level (see rateLimit.ts)
    // Cooldowns are action-specific and checked during action validation
    rateLimited: false,
    cooldownEndsAt: undefined,
  };
}

function notice(id: string, severity: Severity, text: string) {
  return { id, severity, text };
}

// Actions catalogue (UI-facing, stable IDs)
const ACTIONS_CATALOGUE = [
  {
    id: "verify_x",
    title: "Verify with X",
    description: "Connect your X account to unlock actions.",
    category: "progression" as const,
    rewardHint: "Unlock quests",
    requiresVerified: false,
    cta: { type: "verify_x" as const, label: "Verify" },
  },
  {
    id: "daily_checkin",
    title: "Daily check-in",
    description: "Keep your streak alive.",
    category: "daily" as const,
    rewardHint: "XP + streak",
    requiresVerified: true,
    // Wire to gamification action endpoint
    cta: {
      type: "call_api" as const,
      label: "Check-in",
      method: "POST" as const,
      path: "/api/gamification/action",
      body: { action: "streak_tick", idempotencyKey: crypto.randomUUID() },
    },
  },
  {
    id: "share_post",
    title: "Share a post",
    description: "Spread the signal. Proof via X.",
    category: "social" as const,
    rewardHint: "Badge progress",
    requiresVerified: true,
    // Use X intent URL for now; later switch to shareApiRouter flow
    cta: { type: "open_url" as const, label: "Share", url: "https://x.com/intent/tweet?text=$HORNY" },
  },
  {
    id: "forge_event",
    title: "Forge an event",
    description: "Create a signal event (server-verified).",
    category: "event" as const,
    rewardHint: "XP + badge",
    requiresVerified: true,
    // Wire to existing /api/forge endpoint
    cta: {
      type: "call_api" as const,
      label: "Forge",
      method: "POST" as const,
      path: "/api/forge",
      body: { type: "signal" },
    },
  },
];

const actionsRouter = Router();

actionsRouter.get("/actions", async (req, res) => {
  try {
    const ctx = await getUserCtx(req as AuthenticatedRequest);

    const userStatus: ActionsDTO["user"]["status"] = !ctx.verified
      ? "anonymous"
      : ctx.rateLimited
        ? "rate_limited"
        : ctx.cooldownEndsAt
          ? "cooldown"
          : "verified";

    const notices: ActionsDTO["system"]["notices"] = [];
    if (userStatus === "anonymous") notices.push(notice("verify", "info", "Verify with X to unlock actions."));
    if (userStatus === "rate_limited") notices.push(notice("rate", "warn", "Rate limited — try again later."));
    if (userStatus === "cooldown") notices.push(notice("cooldown", "info", "Cooldown active — some actions are temporarily disabled."));

    // TODO: overlay real action states from gamificationRouter services:
    // e.g. state map { daily_checkin: {state:'cooldown', cooldownEndsAt: ...}, ... }
    // This would query user stats and check cooldowns/progress from the gamification store
    const overlayStates: Record<
      string,
      { state: ActionsDTO["actions"][number]["state"]; cooldownEndsAt?: string; progress?: { current: number; target: number } }
    > = {};

    const actions: ActionsDTO["actions"] = ACTIONS_CATALOGUE.map((a) => {
      // Base state
      let state: ActionsDTO["actions"][number]["state"] = "available";
      if (a.requiresVerified && !ctx.verified) state = "locked";
      if (a.id === "verify_x" && ctx.verified) state = "completed";

      // Overlay gamification service truth if present
      const o = overlayStates[a.id];
      if (o) state = o.state;

      // Compute disabled CTA on non-available states
      let cta: ActionsDTO['actions'][number]['cta'] = a.cta;
      if (state === "locked") cta = { type: "disabled", label: "Locked", reason: "Verify required" };
      if (state === "cooldown") cta = { type: "disabled", label: "Cooldown", reason: "Try later" };
      if (state === "completed") cta = { type: "disabled", label: "Done" };

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        category: a.category,
        rewardHint: a.rewardHint,
        state,
        cooldownEndsAt: o?.cooldownEndsAt,
        progress: o?.progress,
        cta,
      };
    });

    const dto: ActionsDTO = { user: { status: userStatus }, actions, system: { notices } };
    res.json(dto);
  } catch (e: unknown) {
    res.status(500).json({
      error: "actions_readmodel_failed",
      message: (e as Error)?.message ?? "Unknown error",
      system: { notices: [notice("err", "error", "Actions failed to load.")] },
    });
  }
});

export default actionsRouter;

