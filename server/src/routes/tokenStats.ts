import { Router } from "express";
import { getTokenStats } from "../services/tokenStatsService";

const router = Router();

function resolveFallbackPairUrl(): string | null {
  return (
    process.env.DEX_LINK ||
    process.env.NEXT_PUBLIC_DEX_LINK ||
    process.env.VITE_DEX_LINK ||
    null
  );
}

function resolveDefaultMint(): string | null {
  return (
    process.env.TOKEN_MINT ||
    process.env.NEXT_PUBLIC_TOKEN_MINT ||
    process.env.VITE_TOKEN_MINT ||
    null
  );
}

router.get("/token-stats", async (req, res) => {
  const mint = typeof req.query.mint === "string" ? req.query.mint : resolveDefaultMint();
  if (!mint) {
    res.status(400).json({ error: "Missing token mint", code: "TOKEN_MINT_REQUIRED" });
    return;
  }

  const fallbackPairUrl = resolveFallbackPairUrl();

  try {
    const { response, cacheHit, cacheAgeMs, providerLatencyMs, providerError } =
      await getTokenStats({ mint, fallbackPairUrl });

    console.info("token-stats", {
      mint,
      cache_hit: cacheHit,
      cache_age: cacheAgeMs,
      provider_latency: providerLatencyMs,
      provider_error: providerError,
    });

    res.json(response);
  } catch (err) {
    console.error("token-stats failed", err);
    res.status(500).json({ error: "Token stats unavailable", code: "TOKEN_STATS_ERROR" });
  }
});

export default router;
