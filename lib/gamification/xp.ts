/**
 * XP values and daily caps for gamification events
 */

export type XPEventType =
  | "forge_generate"
  | "artifact_release"
  | "vote_cast"
  | "vote_received"
  | "share_click"
  | "daily_return"
  | "streak_bonus";

export interface XPConfig {
  xp: number;
  dailyCap: number | null; // null = unlimited
}

export const XP_VALUES: Record<XPEventType, XPConfig> = {
  forge_generate: { xp: 1, dailyCap: 10 },
  artifact_release: { xp: 3, dailyCap: 5 },
  vote_cast: { xp: 1, dailyCap: 20 },
  vote_received: { xp: 2, dailyCap: null }, // unlimited
  share_click: { xp: 2, dailyCap: 10 },
  daily_return: { xp: 2, dailyCap: 1 },
  streak_bonus: { xp: 5, dailyCap: 1 }, // weekly cap
};

export const DAILY_XP_CAP = 100; // Total XP cap per day

/**
 * Get XP value for an event type
 */
export function getXPValue(eventType: XPEventType): number {
  return XP_VALUES[eventType].xp;
}

/**
 * Get daily cap for an event type
 */
export function getDailyCap(eventType: XPEventType): number | null {
  return XP_VALUES[eventType].dailyCap;
}

