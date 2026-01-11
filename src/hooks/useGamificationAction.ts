import { useCallback, useEffect, useState } from "react";
import type { ActionResult, ActionType, UserStats } from "../gamification/types";
import { fetchMyStats, loadUserStatsCache, performGamificationAction } from "../api/gamificationClient";

export function useGamificationAction() {
  const [stats, setStats] = useState<UserStats | null>(() => loadUserStatsCache());
  const [lastResult, setLastResult] = useState<ActionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // hydrate canonical stats on mount
    (async () => {
      try {
        setLoading(true);
        const s = await fetchMyStats();
        setStats(s);
      } catch {
        // ok if server not running yet; cache still works
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const run = useCallback(async (action: ActionType, payload: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await performGamificationAction(action, payload);
      setStats(res.stats);
      setLastResult(res.result);
      return res;
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, lastResult, loading, error, run };
}

