export type XpEventType =
  | 'forge_generate'
  | 'artifact_release'
  | 'vote_cast'
  | 'vote_received'
  | 'share_click'
  | 'daily_return';

export type XpEventConfig = {
  xp: number;
  dailyCap?: number;
};

export const DAILY_XP_CAP = 100;

export const XP_EVENT_CONFIG: Record<XpEventType, XpEventConfig> = {
  forge_generate: { xp: 1, dailyCap: 10 },
  artifact_release: { xp: 3, dailyCap: 5 },
  vote_cast: { xp: 1, dailyCap: 20 },
  vote_received: { xp: 2 },
  share_click: { xp: 2, dailyCap: 10 },
  daily_return: { xp: 2, dailyCap: 1 },
};

export const STREAK_BONUS_XP = 5;
