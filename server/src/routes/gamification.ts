import { Router } from "express";
import type { ActionType, ActionContext } from "../gamification/types";
import { gamificationStore } from "../store/gamificationStore";
import { applyAction } from "../gamification/engine";

export const gamificationRouter = Router();

// Replace with real auth; for now use a stable demo user.
// You can also read from req.user if you already attach it.
function getUserId(req: any) {
  return req.header("x-user-id") || "local-user";
}

// Proof validation placeholders (important actions)
function validateProofOrThrow(action: ActionType, body: any) {
  // In production, you would validate:
  // - votes_received: unique voter proofs, anti-sybil checks, server-side vote ledger
  // - artifact_release: ownership/creation proof
  // - share: actual share proof (OAuth / signed intent)
  // - forge: rate limits / usage gates
  //
  // For now: basic shape checks.
  if ((action === "votes_received") && typeof body.receivedVotesDelta !== "number") {
    throw new Error("votes_received requires receivedVotesDelta:number");
  }
  if ((action === "time_spent") && typeof body.timeDeltaSeconds !== "number") {
    throw new Error("time_spent requires timeDeltaSeconds:number");
  }
}

gamificationRouter.get("/me", (req, res) => {
  const userId = getUserId(req);
  const nowISO = new Date().toISOString();
  const stats = gamificationStore.getOrCreate(userId, nowISO);
  res.json({ stats });
});

gamificationRouter.post("/action", (req, res) => {
  try {
    const userId = getUserId(req);

    const headerIdem = req.header("Idempotency-Key");
    const action = req.body?.action as ActionType;
    const bodyIdem = req.body?.idempotencyKey as string | undefined;
    const idempotencyKey = (headerIdem || bodyIdem || "").trim();

    if (!action) return res.status(400).json({ error: "Missing action" });
    if (!idempotencyKey) return res.status(400).json({ error: "Missing Idempotency-Key" });

    validateProofOrThrow(action, req.body);

    const nowISO = new Date().toISOString();

    // idempotency (server truth)
    if (gamificationStore.wasProcessed(userId, idempotencyKey)) {
      const stats = gamificationStore.getOrCreate(userId, nowISO);
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

    const prev = gamificationStore.getOrCreate(userId, nowISO);

    const ctx: ActionContext = {
      nowISO,
      idempotencyKey,
      artifactId: req.body?.artifactId,
      receivedVotesDelta: req.body?.receivedVotesDelta,
      timeDeltaSeconds: req.body?.timeDeltaSeconds,
      quizClassId: req.body?.quizClassId,
      quizVector: req.body?.quizVector,
    };

    const { next, result } = applyAction(prev, action, ctx);

    gamificationStore.save(userId, next);
    gamificationStore.markProcessed(userId, idempotencyKey);

    // NOTE: Here is where you'd queue Solana payout of result.deltaHorny
    // e.g. enqueueMint(userId, result.deltaHorny, idempotencyKey)

    res.json({ stats: next, result });
  } catch (e: any) {
    // Return canonical stats if possible to prevent UI drift
    const userId = getUserId(req);
    const nowISO = new Date().toISOString();
    const stats = gamificationStore.getOrCreate(userId, nowISO);
    res.status(400).json({ error: e?.message ?? "Unknown error", stats });
  }
});

