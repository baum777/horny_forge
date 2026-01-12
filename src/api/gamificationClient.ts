import type { ActionResult, ActionType, UserStats } from "../gamification/types";

const LS_KEY = "horny_gamification_user_stats_cache_v1";
const SERVER_BASE = "http://localhost:3001";

export function loadUserStatsCache(): UserStats | null {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserStats;
  } catch {
    return null;
  }
}

export function saveUserStatsCache(stats: UserStats) {
  localStorage.setItem(LS_KEY, JSON.stringify(stats));
}

export type GamificationResponse = { stats: UserStats; result: ActionResult };

export async function fetchMyStats(): Promise<UserStats> {
  const res = await fetch(`${SERVER_BASE}/api/gamification/me`, {
    credentials: "include",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `Failed to load stats (${res.status})`);
  saveUserStatsCache(data.stats as UserStats);
  return data.stats as UserStats;
}

export async function performGamificationAction(
  action: ActionType,
  payload: Record<string, unknown> = {}
): Promise<GamificationResponse> {
  const idempotencyKey =
    payload.idempotencyKey ??
    `${action}:${payload.artifactId ?? ""}:${payload.clientNonce ?? crypto.randomUUID()}`;

  const res = await fetch(`${SERVER_BASE}/api/gamification/action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ action, ...payload, idempotencyKey }),
    credentials: "include",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `Action failed (${res.status})`);

  saveUserStatsCache(data.stats as UserStats);
  return data as GamificationResponse;
}

