// DexScreener API integration for token stats

import type { TokenStats, DexScreenerPair, DexScreenerResponse } from './types';

const TOKEN_MINT = '7S2bVZJYAYQwN6iwwf2fMMWu15ajLveh2QDYhtJ3pump';
const DEX_LINK = 'https://dexscreener.com/solana/earthgewsskrbg6cmvx9ddxntniac4shmsthr5nnxwji';
const API_URL = `https://api.dexscreener.com/token-pairs/v1/solana/${TOKEN_MINT}`;

// Cache for last known good values
let cachedStats: TokenStats | null = null;

function selectBestPair(pairs: DexScreenerPair[]): DexScreenerPair | null {
  if (!pairs || pairs.length === 0) return null;
  
  // Sort by liquidity (highest first) and pick the best
  return pairs.reduce((best, pair) => {
    const bestLiquidity = best?.liquidity?.usd ?? 0;
    const pairLiquidity = pair?.liquidity?.usd ?? 0;
    return pairLiquidity > bestLiquidity ? pair : best;
  }, pairs[0]);
}

function formatUsd(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return null;
  
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  if (num < 0.01) {
    return `$${num.toFixed(6)}`;
  }
  return `$${num.toFixed(2)}`;
}

export async function fetchTokenStats(): Promise<TokenStats> {
  try {
    const response = await fetch(API_URL, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }
    
    const data: DexScreenerResponse = await response.json();
    const bestPair = selectBestPair(data.pairs);
    
    if (!bestPair) {
      throw new Error('No pairs found');
    }
    
    const stats: TokenStats = {
      priceUsd: bestPair.priceUsd ? formatUsd(parseFloat(bestPair.priceUsd)) : null,
      fdvUsd: formatUsd(bestPair.marketCap ?? bestPair.fdv),
      liquidityUsd: formatUsd(bestPair.liquidity?.usd),
      volume24hUsd: formatUsd(bestPair.volume?.h24),
      holders: null, // Will be fetched separately if provider is configured
      pairUrl: bestPair.url || DEX_LINK,
      updatedAt: new Date(),
      isStale: false,
    };
    
    // Cache the successful result
    cachedStats = stats;
    
    // Also save to localStorage for persistence
    try {
      localStorage.setItem('horny_token_stats', JSON.stringify({
        ...stats,
        updatedAt: stats.updatedAt.toISOString(),
      }));
    } catch (e) {
      // Ignore localStorage errors
    }
    
    return stats;
  } catch (error) {
    console.error('Failed to fetch token stats:', error);
    
    // Return cached stats if available, marked as stale
    if (cachedStats) {
      return { ...cachedStats, isStale: true };
    }
    
    // Try to load from localStorage
    try {
      const stored = localStorage.getItem('horny_token_stats');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          updatedAt: new Date(parsed.updatedAt),
          isStale: true,
        };
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    
    // Return empty stats
    return {
      priceUsd: null,
      fdvUsd: null,
      liquidityUsd: null,
      volume24hUsd: null,
      holders: null,
      pairUrl: DEX_LINK,
      updatedAt: new Date(),
      isStale: true,
    };
  }
}
