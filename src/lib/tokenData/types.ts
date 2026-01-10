// Token stats types for THE HORNY ARCHIVES

export interface TokenStats {
  priceUsd: string | null;
  fdvUsd: string | null;
  liquidityUsd: string | null;
  volume24hUsd: string | null;
  holders: number | null;
  pairUrl: string;
  updatedAt: Date;
  isStale: boolean;
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap?: number;
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
}

export interface DexScreenerResponse {
  pairs: DexScreenerPair[];
}
