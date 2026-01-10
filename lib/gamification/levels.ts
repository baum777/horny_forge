export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 10 },
  { level: 3, xp: 30 },
  { level: 4, xp: 70 },
  { level: 5, xp: 130 },
  { level: 6, xp: 220 },
  { level: 7, xp: 350 },
  { level: 8, xp: 520 },
  { level: 9, xp: 750 },
  { level: 10, xp: 1050 },
] as const;

export type LevelDefinition = (typeof LEVEL_THRESHOLDS)[number];

export function getLevelFromXp(xpTotal: number): number {
  const sorted = [...LEVEL_THRESHOLDS].sort((a, b) => a.level - b.level);
  let current = sorted[0]?.level ?? 1;
  for (const entry of sorted) {
    if (xpTotal >= entry.xp) {
      current = entry.level;
    }
  }
  return current;
}

export function getNextLevelXp(level: number): number | null {
  const next = LEVEL_THRESHOLDS.find((entry) => entry.level === level + 1);
  return next ? next.xp : null;
}

export function getCurrentLevelXp(level: number): number {
  const current = LEVEL_THRESHOLDS.find((entry) => entry.level === level);
  return current ? current.xp : 0;
}

export function getLevelProgress(xpTotal: number): {
  currentLevel: number;
  nextLevel: number | null;
  currentXp: number;
  nextXp: number | null;
  progressPercent: number;
} {
  const currentLevel = getLevelFromXp(xpTotal);
  const currentXp = getCurrentLevelXp(currentLevel);
  const nextXp = getNextLevelXp(currentLevel);
  if (!nextXp) {
    return {
      currentLevel,
      nextLevel: null,
      currentXp,
      nextXp: null,
      progressPercent: 100,
    };
  }
  const span = nextXp - currentXp;
  const progress = span > 0 ? ((xpTotal - currentXp) / span) * 100 : 0;
  return {
    currentLevel,
    nextLevel: currentLevel + 1,
    currentXp,
    nextXp,
    progressPercent: Math.max(0, Math.min(100, progress)),
  };
}
