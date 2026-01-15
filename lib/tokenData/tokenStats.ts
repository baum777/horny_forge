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

export async function fetchTokenStats(params: { mint?: string } = {}): Promise<TokenStatsResponse> {
  const { mint } = params;
  const query = mint ? `?mint=${encodeURIComponent(mint)}` : "";
  const res = await fetch(`/api/token-stats${query}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Token stats error: ${res.status}`);
  return (await res.json()) as TokenStatsResponse;
}
