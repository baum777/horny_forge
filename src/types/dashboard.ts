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
    locked: Array<{ id: string; name: string; icon: string; progress?: { current: number; target: number } }>;
  };
  rewards: {
    pendingCount: number;
    recent: Array<{ id: string; amountText: string; createdAt: string; status: "pending" | "paid" | "failed" }>;
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
    notices: Array<{ id: string; severity: "info" | "warn" | "error"; text: string }>;
  };
};

