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

export function getLevelFromXp(xpTotal: number): number {
  let current = 1;
  for (const entry of LEVEL_THRESHOLDS) {
    if (xpTotal >= entry.xp) {
      current = entry.level;
    }
  }
  return current;
}
