// server/src/utils/badgeAssets.ts
// Badge asset URL helper (reads manifest.json if available)

import fs from "fs";
import path from "path";

type BadgeManifest = {
  version: string;
  basePath: string;
  badges: Record<
    string,
    {
      rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
      file: string;
    }
  >;
};

let cachedManifest: BadgeManifest | null = null;

function loadManifest(): BadgeManifest | null {
  if (cachedManifest) return cachedManifest;

  const manifestPath = path.join(process.cwd(), "public", "badges", "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(manifestPath, "utf8");
    cachedManifest = JSON.parse(raw) as BadgeManifest;
    return cachedManifest;
  } catch {
    return null;
  }
}

/**
 * Get badge icon URL from badgeId.
 * Falls back to default path structure if manifest not available.
 */
export function getBadgeIconUrl(
  badgeId: string,
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary"
): string {
  const manifest = loadManifest();

  if (manifest && manifest.badges[badgeId]) {
    const badge = manifest.badges[badgeId];
    return `${manifest.basePath}/${badge.file}`;
  }

  // Fallback: construct path from badgeId and rarity
  const version = manifest?.version ?? "v1";
  const inferredRarity = rarity ?? "common";
  return `/badges/${version}/${inferredRarity}/${badgeId.toLowerCase()}.webp`;
}

/**
 * Get fallback icon URL (for missing badges)
 */
export function getBadgeFallbackIconUrl(): string {
  const manifest = loadManifest();
  const version = manifest?.version ?? "v1";
  return `/badges/${version}/ui/unknown.svg`;
}

