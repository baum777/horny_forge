/**
 * Level thresholds and calculations
 */

export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 10,
  3: 30,
  4: 70,
  5: 130,
  6: 220,
  7: 350,
  8: 520,
  9: 750,
  10: 1050,
};

export const MAX_LEVEL = 10;

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): number {
  let level = 1;
  for (let l = MAX_LEVEL; l >= 1; l--) {
    if (totalXP >= LEVEL_THRESHOLDS[l]) {
      level = l;
      break;
    }
  }
  return level;
}

/**
 * Get XP required for next level
 */
export function getXPForNextLevel(currentLevel: number): number | null {
  if (currentLevel >= MAX_LEVEL) {
    return null; // Max level reached
  }
  return LEVEL_THRESHOLDS[currentLevel + 1];
}

/**
 * Get XP progress to next level
 */
export function getXPProgress(currentXP: number, currentLevel: number): {
  current: number;
  required: number;
  percentage: number;
} {
  const required = getXPForNextLevel(currentLevel);
  if (required === null) {
    return { current: currentXP, required: 0, percentage: 100 };
  }
  
  const currentLevelThreshold = LEVEL_THRESHOLDS[currentLevel];
  const progressXP = currentXP - currentLevelThreshold;
  const requiredXP = required - currentLevelThreshold;
  const percentage = Math.min(100, Math.max(0, (progressXP / requiredXP) * 100));
  
  return {
    current: progressXP,
    required: requiredXP,
    percentage,
  };
}

