export type ForgePresetId = 'HORNY_CORE_SKETCH' | 'HORNY_META_SCENE' | 'HORNY_CHAOS_VARIATION';
export type BaseImageId = string;

export const FORGE_PRESET_UNLOCKS: Record<ForgePresetId, number> = {
  HORNY_CORE_SKETCH: 1,
  HORNY_META_SCENE: 2,
  HORNY_CHAOS_VARIATION: 4,
};

export const BASE_IMAGE_UNLOCKS: Record<string, number> = {
  'base-01': 1,
  'base-02': 2,
  'base-03': 3,
  'base-04': 5,
};

export const UI_PRIVILEGES = [
  { level: 3, label: 'Profile glow' },
  { level: 6, label: 'Rare tag highlight' },
  { level: 8, label: 'Feed emphasis' },
] as const;

export function isPresetUnlocked(level: number, preset: ForgePresetId): boolean {
  return level >= FORGE_PRESET_UNLOCKS[preset];
}

export function isBaseUnlocked(level: number, base: BaseImageId): boolean {
  const requiredLevel = BASE_IMAGE_UNLOCKS[base];
  if (!requiredLevel) {
    return true;
  }
  return level >= requiredLevel;
}

export function getUnlockedPresets(level: number): ForgePresetId[] {
  return (Object.keys(FORGE_PRESET_UNLOCKS) as ForgePresetId[]).filter((preset) =>
    isPresetUnlocked(level, preset)
  );
}

export function getUnlockedBases(level: number): BaseImageId[] {
  return Object.keys(BASE_IMAGE_UNLOCKS).filter((base) => isBaseUnlocked(level, base));
}
