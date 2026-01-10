export type DexPair = {
  url?: string;
  priceUsd?: string;
  fdv?: number;
  marketCap?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  // DexScreener often includes this, but we don't rely on it.
  priceChange?: { h24?: number };
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

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function fetchDexScreenerTokenStats(params: {
  tokenMint: string;
  fallbackPairUrl: string;
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

