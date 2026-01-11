"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { TokenStats } from "../tokenData/dexscreener";

type TokenStatsContextValue = {
  stats: TokenStats;
  holders: number | null;
  loading: boolean;
  error: boolean;
  refresh: () => void;
};

const TokenStatsContext = createContext<TokenStatsContextValue | undefined>(undefined);

const POLL_MS = 45_000;
const STORAGE_KEY = "horny_token_stats_v1";

type CachedPayload = {
  stats: TokenStats;
  holders: number | null;
};

let inMemoryCache: CachedPayload | null = null;

function getInitialCached(): CachedPayload | null {
  if (inMemoryCache) return inMemoryCache;
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    if (!parsed?.stats) return null;
    inMemoryCache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

function persistCache(next: CachedPayload) {
  inMemoryCache = next;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function staleify(payload: CachedPayload): CachedPayload {
  return {
    ...payload,
    stats: {
      ...payload.stats,
      isStale: true,
    },
  };
}

function emptyStale(): CachedPayload {
  const fallbackPairUrl = process.env.NEXT_PUBLIC_DEX_LINK ?? "";
  return {
    stats: {
      priceUsd: null,
      fdvUsd: null,
      liquidityUsd: null,
      volume24hUsd: null,
      pairUrl: fallbackPairUrl,
      updatedAt: new Date().toISOString(),
      isStale: true,
    },
    holders: null,
  };
}

export function TokenStatsProvider({ children }: { children: React.ReactNode }) {
  const tokenMint = process.env.NEXT_PUBLIC_TOKEN_MINT ?? "";
  const fallbackPairUrl = process.env.NEXT_PUBLIC_DEX_LINK ?? "";

  const initial = useMemo(() => getInitialCached() ?? emptyStale(), []);

  const [payload, setPayload] = useState<CachedPayload>(initial);
  const [loading, setLoading] = useState(!getInitialCached());
  const [error, setError] = useState(false);

  const inFlight = useRef<Promise<void> | null>(null);

  const doFetch = useCallback(async () => {
    if (!tokenMint) {
      setPayload((prev) => staleify(prev));
      setError(true);
      setLoading(false);
      return;
    }

    // de-dupe overlapping refresh/poll calls
    if (inFlight.current) return inFlight.current;

    inFlight.current = (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/token-stats");
        if (!res.ok) throw new Error("Failed to fetch token stats");
        const data = await res.json();
        
        const next: CachedPayload = { 
          stats: data.stats, 
          holders: data.holders 
        };
        persistCache(next);
        setPayload(next);
        setError(false);
      } catch (e) {
        const cached = getInitialCached();
        setPayload(cached ? staleify(cached) : emptyStale());
        setError(true);
      } finally {
        setLoading(false);
        inFlight.current = null;
      }
    })();

    return inFlight.current;
  }, [tokenMint, fallbackPairUrl]);

  useEffect(() => {
    void doFetch();
    const id = window.setInterval(() => void doFetch(), POLL_MS);
    return () => window.clearInterval(id);
  }, [doFetch]);

  const value = useMemo<TokenStatsContextValue>(
    () => ({
      stats: payload.stats,
      holders: payload.holders,
      loading,
      error,
      refresh: () => void doFetch(),
    }),
    [payload, loading, error, doFetch]
  );

  return <TokenStatsContext.Provider value={value}>{children}</TokenStatsContext.Provider>;
}

export function useTokenStats() {
  const ctx = useContext(TokenStatsContext);
  if (!ctx) throw new Error("useTokenStats must be used within a TokenStatsProvider");
  return ctx;
}
