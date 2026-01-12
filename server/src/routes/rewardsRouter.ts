// server/src/routes/rewardsRouter.ts
// Rewards Aggregation Readmodel (Read-only payouts + pending queue)
// Aggregates payout data from payout_jobs table

import { Router } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import { GamificationStoreSupabase } from "../store/gamificationStoreSupabase";

type Severity = "info" | "warn" | "error";

export type RewardsDTO = {
  user: { status: "anonymous" | "verified" | "cooldown" | "rate_limited"; id?: string };
  summary: {
    pendingCount: number;
    paidCount?: number;
    failedCount?: number;
    yourPendingPosition?: number;
  };
  pendingQueue: Array<{
    id: string;
    createdAt: string;
    amountText: string;
    status: "pending";
    mine?: boolean;
  }>;
  recent: Array<{
    id: string;
    createdAt: string;
    amountText: string;
    status: "pending" | "paid" | "failed";
    txUrl?: string;
  }>;
  rules: Array<{ id: string; title: string; text: string }>;
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

// Format amount as text (e.g., "10 $HORNY")
function formatAmount(amount: number): string {
  return `${amount} $HORNY`;
}

// Fetch pending queue from payout_jobs table
async function fetchPendingQueue(): Promise<
  Array<{ id: string; createdAt: string; amountText: string; status: "pending"; userId?: string }>
> {
  try {
    // Access supabase client from store
    const supabase = (store as any).supabase;
    if (!supabase) {
      console.error("Supabase client not available");
      return [];
    }

    const { data, error } = await supabase
      .from("payout_jobs")
      .select("id, user_id, amount, created_at, status")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Failed to fetch pending queue:", error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      createdAt: row.created_at ?? new Date().toISOString(),
      amountText: formatAmount(row.amount ?? 0),
      status: "pending" as const,
      userId: row.user_id,
    }));
  } catch (e) {
    console.error("Error fetching pending queue:", e);
    return [];
  }
}

// Fetch recent payouts from payout_jobs table
async function fetchRecentPayouts(): Promise<
  Array<{ id: string; createdAt: string; amountText: string; status: "pending" | "paid" | "failed"; txUrl?: string; userId?: string }>
> {
  try {
    // Access supabase client from store
    const supabase = (store as any).supabase;
    if (!supabase) {
      console.error("Supabase client not available");
      return [];
    }

    const { data, error } = await supabase
      .from("payout_jobs")
      .select("id, user_id, amount, created_at, status, tx_url")
      .in("status", ["pending", "paid", "failed"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to fetch recent payouts:", error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      createdAt: row.created_at ?? new Date().toISOString(),
      amountText: formatAmount(row.amount ?? 0),
      status: (row.status ?? "pending") as "pending" | "paid" | "failed",
      txUrl: row.tx_url ?? undefined,
      userId: row.user_id,
    }));
  } catch (e) {
    console.error("Error fetching recent payouts:", e);
    return [];
  }
}

const rewardsRouter = Router();

rewardsRouter.get("/rewards", async (req, res) => {
  try {
    const ctx = await getUserCtx(req as AuthenticatedRequest);

    const userStatus: RewardsDTO["user"]["status"] = ctx.verified ? "verified" : "anonymous";

    const systemNotices: RewardsDTO["system"]["notices"] = [];
    if (!ctx.verified) {
      systemNotices.push(notice("verify", "info", "Verify with X to appear in the rewards loop."));
    }

    const [pendingQueueRaw, recentRaw] = await Promise.all([fetchPendingQueue(), fetchRecentPayouts()]);

    // Mark mine + compute position if possible without leaking identifiers
    const pendingQueue = pendingQueueRaw.map((p) => ({
      id: p.id,
      createdAt: p.createdAt,
      amountText: p.amountText,
      status: "pending" as const,
      mine: ctx.verified && p.userId ? p.userId === ctx.userId : false,
    }));

    const yourIndex = pendingQueue.findIndex((p) => p.mine);
    const yourPendingPosition = yourIndex >= 0 ? yourIndex + 1 : undefined;

    const recent = recentRaw.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      amountText: r.amountText,
      status: r.status,
      txUrl: r.txUrl,
    }));

    const paidCount = recentRaw.filter((r) => r.status === "paid").length;
    const failedCount = recentRaw.filter((r) => r.status === "failed").length;

    const rules: RewardsDTO["rules"] = [
      {
        id: "r1",
        title: "No wallet connect (yet)",
        text: "Rewards are recorded server-side. Claiming will be introduced later with explicit rules.",
      },
      {
        id: "r2",
        title: "Transparency > promises",
        text: "Queue order, status, and history are visible. Amounts are informational and may be subject to review.",
      },
      {
        id: "r3",
        title: "Anti-abuse",
        text: "Suspicious activity can pause rewards. Actions may enter cooldown or be marked as failed.",
      },
    ];

    const dto: RewardsDTO = {
      user: { status: userStatus, id: ctx.verified ? ctx.userId : undefined },
      summary: {
        pendingCount: pendingQueue.length,
        paidCount,
        failedCount,
        yourPendingPosition,
      },
      pendingQueue,
      recent,
      rules,
      system: { notices: systemNotices },
    };

    res.json(dto);
  } catch (e: any) {
    res.status(500).json({
      error: "rewards_readmodel_failed",
      message: e?.message ?? "Unknown error",
      system: { notices: [notice("err", "error", "Rewards failed to load.")] },
    });
  }
});

export default rewardsRouter;

