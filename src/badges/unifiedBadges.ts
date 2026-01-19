import type { UserStats } from "../gamification/types";

export type UnlockCondition =
  | { type: "action_count"; action: string; count: number }
  | { type: "streak"; days: number }
  | { type: "milestone"; metric: string; value: number }
  | { type: "time_spent"; seconds: number }
  | { type: "votes_received"; count: number }
  | { type: "hashtag_usage"; hashtag: string; count: number }
  | { type: "special"; requirement: string };

export type UnifiedBadge = {
  id: string;
  nameKey: string;
  descriptionKey: string;
  emoji?: string;
  unlockCondition: UnlockCondition;
};

export const ALL_BADGES: UnifiedBadge[] = [
  {
    id: "HORN_SPARK",
    nameKey: "gamification.badges.spark.name",
    descriptionKey: "gamification.badges.spark.description",
    emoji: "⚡",
    unlockCondition: { type: "action_count", action: "vote", count: 1 },
  },
  {
    id: "FIRST_PUMP",
    nameKey: "gamification.badges.firstRelease.name",
    descriptionKey: "gamification.badges.firstRelease.description",
    emoji: "📈",
    unlockCondition: { type: "action_count", action: "artifact_release", count: 1 },
  },
  {
    id: "FIRST_COMMENT",
    nameKey: "gamification.badges.firstComment.name",
    descriptionKey: "gamification.badges.firstComment.description",
    emoji: "💬",
    unlockCondition: { type: "action_count", action: "comment", count: 1 },
  },
  {
    id: "SHARE_SPARK",
    nameKey: "gamification.badges.firstShare.name",
    descriptionKey: "gamification.badges.firstShare.description",
    emoji: "📢",
    unlockCondition: { type: "action_count", action: "share", count: 1 },
  },
];

export function checkUnlockCondition(condition: UnlockCondition, stats: UserStats): boolean {
  switch (condition.type) {
    case "action_count":
      return (stats.counts[condition.action] ?? 0) >= condition.count;
    case "streak":
      return (stats.currentStreak ?? 0) >= condition.days;
    case "milestone":
      return (stats.counts[condition.metric] ?? 0) >= condition.value;
    case "time_spent":
      return (stats.totalTimeSeconds ?? 0) >= condition.seconds;
    case "votes_received":
      return (stats.totalVotesReceived ?? 0) >= condition.count;
    case "hashtag_usage":
      return (stats.counts[`hashtag_${condition.hashtag}`] ?? 0) >= condition.count;
    case "special":
      return false; // server-only
    default:
      return false;
  }
}

export function evaluateNewBadgesAndFeatures(stats: UserStats): {
  newBadges: string[];
  newFeatures: string[];
} {
  const newBadges: string[] = [];
  for (const b of ALL_BADGES) {
    if (!stats.unlockedBadges.includes(b.id) && checkUnlockCondition(b.unlockCondition, stats)) {
      newBadges.push(b.id);
    }
  }

  const newFeatures: string[] = [];
  if (newBadges.includes("FIRST_PUMP") && !stats.unlockedFeatures.includes("creator_chip")) {
    newFeatures.push("creator_chip");
  }

  return { newBadges, newFeatures };
}
