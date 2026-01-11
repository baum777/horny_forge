export type ActionType =
  | "browse"
  | "vote"
  | "comment"
  | "share"
  | "follow"
  | "forge"
  | "artifact_release"
  | "meme_create"
  | "event_attend"
  | "quiz_complete"
  | "votes_received"
  | "time_spent"
  | "streak_tick"
  | "special";

export type VisibilityTier = "private" | "semi" | "public" | "viral";

export type IncentiveRule = {
  action: ActionType;
  hornyGain: number;
  hornyCap?: { daily?: number; weekly?: number };
  levelRequirement?: number;
  unlocks?: string[];
  visibility: VisibilityTier;
  computeGain?: (ctx: ActionContext) => number;
};

export type VisibilityBoost = {
  level: number;
  feedWeight: number;
  features: string[];
};

export type UserStats = {
  userId: string;

  counts: Record<string, number>;
  totalVotesReceived: number;
  totalTimeSeconds: number;

  quizClass?: string;
  degen?: number;
  horny?: number;
  conviction?: number;

  currentStreak: number;
  lastActiveISO?: string;

  lifetimeHornyEarned: number;
  dailyHornyEarned: number;
  weeklyHornyEarned: number;

  level: number;

  unlockedBadges: string[];
  unlockedFeatures: string[];
};

export type ActionContext = {
  nowISO: string;
  artifactId?: string;
  receivedVotesDelta?: number;
  timeDeltaSeconds?: number;
  quizClassId?: string;
  quizVector?: { degen: number; horny: number; conviction: number };
  idempotencyKey: string;
};

export type ActionResult = {
  deltaHorny: number;
  newLevel: number;
  visibilityBoost: VisibilityBoost;
  newlyUnlockedBadges: string[];
  newlyUnlockedFeatures: string[];
  tier: VisibilityTier;
};

