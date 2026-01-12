// server/src/routes/statusRouter.ts
// Status Aggregation Readmodel (System Health + Config)
// Aggregates health checks and safe config subset

import { Router } from "express";

type ServiceStatus = "ok" | "degraded" | "down";
type Overall = "ok" | "degraded" | "down";

export type StatusDTO = {
  overall: Overall;
  checkedAt: string;
  services: Array<{
    id: string;
    name: string;
    status: ServiceStatus;
    latencyMs?: number;
    lastOkAt?: string;
    message?: string;
  }>;
  config: {
    tokenSymbol?: string;
    frontendUrl?: string;
    env?: "production" | "staging" | "development";
    features: Record<string, boolean>;
  };
  system: {
    notices: Array<{ id: string; severity: "info" | "warn" | "error"; text: string }>;
  };
};

function notice(id: string, severity: "info" | "warn" | "error", text: string) {
  return { id, severity, text };
}

async function timed<T>(fn: () => Promise<T>): Promise<{ ok: boolean; ms: number; value?: T; error?: any }> {
  const t0 = Date.now();
  try {
    const value = await fn();
    return { ok: true, ms: Date.now() - t0, value };
  } catch (error) {
    return { ok: false, ms: Date.now() - t0, error };
  }
}

function classify(ok: boolean, ms: number, warnMs = 500, downMs = 2500): ServiceStatus {
  if (!ok) return "down";
  if (ms >= downMs) return "degraded";
  if (ms >= warnMs) return "degraded";
  return "ok";
}

// Ping health endpoint
async function pingHealth(baseUrl: string) {
  const res = await fetch(`${baseUrl}/health`, { method: "GET" });
  if (!res.ok) throw new Error(`health ${res.status}`);
  const data = await res.json();
  return data;
}

// Ping gamification endpoint (using /me as it's a known GET endpoint)
async function pingGamification(baseUrl: string) {
  // Note: /api/gamification/me requires auth, so we'll just check if the router exists
  // by checking a public endpoint or the router structure
  // For now, we'll check if the endpoint responds (even with 401 is OK, means router exists)
  const res = await fetch(`${baseUrl}/api/gamification/metrics`, { method: "GET" });
  // 404 means router doesn't exist, 200/401/403 means it exists
  if (res.status === 404) throw new Error("endpoint not found");
  return true;
}

// Ping token stats endpoint
async function pingTokenStats(baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/token-stats`, { method: "GET" });
  // 400 is OK (missing mint param), 404 means endpoint doesn't exist
  if (res.status === 404) throw new Error("endpoint not found");
  return true;
}

// Ping Supabase connection (lightweight check)
async function pingSupabase(): Promise<boolean> {
  try {
    const { config } = await import("../config");
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      return false;
    }
    // Just check if config exists, don't actually connect
    return true;
  } catch {
    return false;
  }
}

const statusRouter = Router();

statusRouter.get("/status", async (req, res) => {
  const checkedAt = new Date().toISOString();

  // Determine base URL for self-calls
  const origin = `${req.protocol}://${req.get("host")}`;
  const baseUrl = process.env.SERVER_URL || origin;

  const services = [];

  // 1) Core API health
  const health = await timed(() => pingHealth(baseUrl));
  services.push({
    id: "health",
    name: "API /health",
    status: classify(health.ok, health.ms),
    latencyMs: health.ms,
    lastOkAt: health.ok ? checkedAt : undefined,
    message: health.ok ? "OK" : `Failed (${String(health.error?.message ?? "error")})`,
  });

  // 2) Gamification router
  const gamification = await timed(() => pingGamification(baseUrl));
  services.push({
    id: "gamification",
    name: "Gamification router",
    status: classify(gamification.ok, gamification.ms),
    latencyMs: gamification.ms,
    lastOkAt: gamification.ok ? checkedAt : undefined,
    message: gamification.ok ? "OK" : `Failed (${String(gamification.error?.message ?? "error")})`,
  });

  // 3) Token stats
  const tokenStats = await timed(() => pingTokenStats(baseUrl));
  services.push({
    id: "token_stats",
    name: "Token stats",
    status: classify(tokenStats.ok, tokenStats.ms),
    latencyMs: tokenStats.ms,
    lastOkAt: tokenStats.ok ? checkedAt : undefined,
    message: tokenStats.ok ? "OK" : `Failed (${String(tokenStats.error?.message ?? "error")})`,
  });

  // 4) Supabase config
  const supabase = await timed(() => pingSupabase());
  services.push({
    id: "supabase",
    name: "Supabase config",
    status: classify(supabase.ok, supabase.ms),
    latencyMs: supabase.ms,
    lastOkAt: supabase.ok ? checkedAt : undefined,
    message: supabase.ok ? "OK" : "Config missing",
  });

  const statuses = services.map((s) => s.status);
  const overall: Overall = statuses.includes("down") ? "down" : statuses.includes("degraded") ? "degraded" : "ok";

  const systemNotices = [];
  if (overall !== "ok") {
    systemNotices.push(notice("degraded", overall === "down" ? "error" : "warn", "Some services are degraded."));
  }

  const dto: StatusDTO = {
    overall,
    checkedAt,
    services,
    config: {
      tokenSymbol: process.env.TOKEN_SYMBOL,
      frontendUrl: process.env.FRONTEND_URL,
      env: (process.env.NODE_ENV as "production" | "staging" | "development") || "development",
      features: {
        xLogin: Boolean(process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET),
        payouts: Boolean(process.env.PAYOUTS_ENABLED === "true"),
        memeBackground: true,
        gamification: Boolean(process.env.GAMIFICATION_ENABLED !== "false"),
      },
    },
    system: { notices: systemNotices },
  };

  res.json(dto);
});

export default statusRouter;

