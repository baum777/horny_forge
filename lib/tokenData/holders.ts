export type HoldersProvider = "none" | "solscan" | "helius";

function getProvider(): HoldersProvider {
  const raw = (import.meta.env.NEXT_PUBLIC_HOLDERS_PROVIDER ??
    import.meta.env.VITE_HOLDERS_PROVIDER ??
    "none") as string;
  if (raw === "solscan" || raw === "helius" || raw === "none") return raw;
  return "none";
}

/**
 * Optional holders fetch.
 *
 * Requirements:
 * - default OFF
 * - if provider not configured or missing keys => null
 * - never block token stats fetch (call in parallel upstream)
 */
export async function fetchHoldersCount(): Promise<number | null> {
  const provider = getProvider();
  if (provider === "none") return null;

  // Intentionally conservative: only enable when explicit keys are present.
  if (provider === "helius") {
    const heliusKey =
      import.meta.env.NEXT_PUBLIC_HELIUS_API_KEY ?? import.meta.env.VITE_HELIUS_API_KEY;
    if (!heliusKey) return null;
    // Implementation left intentionally minimal for MVP; return null unless wired.
    return null;
  }

  if (provider === "solscan") {
    const solscanKey =
      import.meta.env.NEXT_PUBLIC_SOLSCAN_API_KEY ?? import.meta.env.VITE_SOLSCAN_API_KEY;
    if (!solscanKey) return null;
    // Implementation left intentionally minimal for MVP; return null unless wired.
    return null;
  }

  return null;
}

