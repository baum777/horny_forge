type DexPair = {
  url?: string;
  priceUsd?: string;
  fdv?: number;
  marketCap?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
};

export type TokenStats = {
  priceUsd: number | null;
  fdvUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  pairUrl: string | null;
  updatedAt: string;
  isStale: boolean;
};

export type TokenStatsResponse = {
  stats: TokenStats;
  holders: number | null;
  stale: boolean;
};

type CacheEntry = {
  response: TokenStatsResponse;
  fetchedAt: number;
};

class LruCache<K, V> {
  private map = new Map<K, V>();
  constructor(private maxSize: number) {}

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.maxSize) {
      const firstKey = this.map.keys().next().value as K | undefined;
      if (firstKey !== undefined) this.map.delete(firstKey);
    }
  }
}

const CACHE_TTL_MS = Number.parseInt(process.env.TOKEN_STATS_TTL_MS || "45000", 10);
const CACHE_MAX = Number.parseInt(process.env.TOKEN_STATS_CACHE_SIZE || "50", 10);
const cache = new LruCache<string, CacheEntry>(Number.isFinite(CACHE_MAX) ? CACHE_MAX : 50);

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function emptyResponse(fallbackPairUrl: string | null): TokenStatsResponse {
  return {
    stats: {
      priceUsd: null,
      fdvUsd: null,
      liquidityUsd: null,
      volume24hUsd: null,
      pairUrl: fallbackPairUrl ?? null,
      updatedAt: new Date().toISOString(),
      isStale: true,
    },
    holders: null,
    stale: true,
  };
}

async function fetchDexScreenerTokenStats(params: {
  tokenMint: string;
  fallbackPairUrl: string | null;
}): Promise<TokenStats> {
  const { tokenMint, fallbackPairUrl } = params;
  const endpoint = `https://api.dexscreener.com/token-pairs/v1/solana/${tokenMint}`;

  const res = await fetch(endpoint, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`DexScreener error: ${res.status}`);

  const pairs = (await res.json()) as DexPair[];
  const best =
    pairs?.slice().sort((a, b) => {
      const la = toNumber(a?.liquidity?.usd) ?? 0;
      const lb = toNumber(b?.liquidity?.usd) ?? 0;
      return lb - la;
    })?.[0] ?? null;

  const updatedAt = new Date().toISOString();

  return {
    priceUsd: toNumber(best?.priceUsd) ?? null,
    fdvUsd: toNumber(best?.marketCap) ?? toNumber(best?.fdv) ?? null,
    liquidityUsd: toNumber(best?.liquidity?.usd) ?? null,
    volume24hUsd: toNumber(best?.volume?.h24) ?? null,
    pairUrl: best?.url ?? fallbackPairUrl ?? null,
    updatedAt,
    isStale: false,
  };
}

export async function getTokenStats(params: {
  mint: string;
  fallbackPairUrl: string | null;
}): Promise<{
  response: TokenStatsResponse;
  cacheHit: boolean;
  cacheAgeMs: number;
  providerLatencyMs: number | null;
  providerError: string | null;
}> {
  const { mint, fallbackPairUrl } = params;
  const now = Date.now();
  const cached = cache.get(mint);
  if (cached) {
    const ageMs = now - cached.fetchedAt;
    if (ageMs < CACHE_TTL_MS && !cached.response.stats.isStale) {
      return {
        response: cached.response,
        cacheHit: true,
        cacheAgeMs: ageMs,
        providerLatencyMs: null,
        providerError: null,
      };
    }
  }

  let providerLatencyMs: number | null = null;
  try {
    const start = Date.now();
    const stats = await fetchDexScreenerTokenStats({ tokenMint: mint, fallbackPairUrl });
    providerLatencyMs = Date.now() - start;

    const response: TokenStatsResponse = {
      stats: { ...stats, isStale: false },
      holders: null,
      stale: false,
    };
    cache.set(mint, { response, fetchedAt: now });
    return {
      response,
      cacheHit: false,
      cacheAgeMs: cached ? now - cached.fetchedAt : 0,
      providerLatencyMs,
      providerError: null,
    };
  } catch (err) {
    const providerError = err instanceof Error ? err.message : "Unknown provider error";
    if (cached) {
      const staleResponse: TokenStatsResponse = {
        ...cached.response,
        stats: { ...cached.response.stats, isStale: true },
        stale: true,
      };
      cache.set(mint, { response: staleResponse, fetchedAt: cached.fetchedAt });
      return {
        response: staleResponse,
        cacheHit: true,
        cacheAgeMs: now - cached.fetchedAt,
        providerLatencyMs: null,
        providerError,
      };
    }

    const response = emptyResponse(fallbackPairUrl);
    cache.set(mint, { response, fetchedAt: now });
    return {
      response,
      cacheHit: false,
      cacheAgeMs: 0,
      providerLatencyMs: null,
      providerError,
    };
  }
}
