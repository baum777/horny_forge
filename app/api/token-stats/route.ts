import { NextResponse } from "next/server";
import { fetchDexScreenerTokenStats } from "@/lib/tokenData/dexscreener";
import type { TokenStats } from "@/lib/tokenData/dexscreener";

const CACHE_TTL = 30; // seconds
let cachedStats: { stats: TokenStats; holders: number | null; timestamp: number } | null = null;

async function fetchHoldersCount(): Promise<number | null> {
  // Placeholder - implement if you have a holders API
  return null;
}

export async function GET() {
  const tokenMint = process.env.NEXT_PUBLIC_TOKEN_MINT;
  const fallbackPairUrl = process.env.NEXT_PUBLIC_DEX_LINK ?? "";

  if (!tokenMint) {
    return NextResponse.json(
      { error: "Token mint not configured" },
      { status: 500 }
    );
  }

  // Check cache
  const now = Date.now();
  if (cachedStats && now - cachedStats.timestamp < CACHE_TTL * 1000) {
    return NextResponse.json({
      stats: cachedStats.stats,
      holders: cachedStats.holders,
    });
  }

  try {
    const [stats, holders] = await Promise.all([
      fetchDexScreenerTokenStats({ tokenMint, fallbackPairUrl }),
      fetchHoldersCount(),
    ]);

    cachedStats = {
      stats,
      holders,
      timestamp: now,
    };

    return NextResponse.json({
      stats,
      holders,
    });
  } catch (error) {
    // Return stale cache if available
    if (cachedStats) {
      return NextResponse.json({
        stats: { ...cachedStats.stats, isStale: true },
        holders: cachedStats.holders,
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch token stats" },
      { status: 500 }
    );
  }
}

