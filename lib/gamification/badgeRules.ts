/**
 * Badge unlock rules and logic
 */

export type BadgeId =
  | "SIGIL_FIRST_INFUSION"
  | "SIGIL_FIRST_RELEASE"
  | "SIGIL_FIRST_VOTE"
  | "STAMP_TREND_SPARK"
  | "STAMP_FEED_DOMINATOR"
  | "FRAGMENT_RETURN_2D"
  | "FRAGMENT_RETURN_7D"
  | "OBJECT_CROISHORNEY"
  | "OBJECT_EICHHORNEY"
  | "OBJECT_BRAINHORNEY"
  | "STATE_X_LINKED";

export interface BadgeUnlockRule {
  badgeId: BadgeId;
  check: (context: BadgeCheckContext) => Promise<boolean>;
}

export interface BadgeCheckContext {
  userId: string;
  eventType?: string;
  artifactId?: string;
  artifactVotes?: number;
  tags?: string[];
  streakDays?: number;
}

/**
 * Badge unlock rules
 * These are checked server-side in the event processor
 */
export const BADGE_UNLOCK_RULES: Record<BadgeId, (context: BadgeCheckContext) => Promise<boolean>> = {
  SIGIL_FIRST_INFUSION: async (context) => {
    // Checked when forge_generate event occurs
    // Server checks if this is user's first forge_generate
    return false; // Server-side check
  },
  
  SIGIL_FIRST_RELEASE: async (context) => {
    // Checked when artifact_release event occurs
    // Server checks if this is user's first artifact_release
    return false; // Server-side check
  },
  
  SIGIL_FIRST_VOTE: async (context) => {
    // Checked when vote_cast event occurs
    // Server checks if this is user's first vote_cast
    return false; // Server-side check
  },
  
  STAMP_TREND_SPARK: async (context) => {
    // Checked when artifact reaches 10 votes
    return (context.artifactVotes ?? 0) >= 10;
  },
  
  STAMP_FEED_DOMINATOR: async (context) => {
    // Checked when artifact reaches 25 votes
    return (context.artifactVotes ?? 0) >= 25;
  },
  
  FRAGMENT_RETURN_2D: async (context) => {
    // Checked on daily_return event
    return (context.streakDays ?? 0) >= 2;
  },
  
  FRAGMENT_RETURN_7D: async (context) => {
    // Checked on daily_return event
    return (context.streakDays ?? 0) >= 7;
  },
  
  OBJECT_CROISHORNEY: async (context) => {
    // Server checks tag usage count
    return false; // Server-side check
  },
  
  OBJECT_EICHHORNEY: async (context) => {
    // Server checks tag usage count
    return false; // Server-side check
  },
  
  OBJECT_BRAINHORNEY: async (context) => {
    // Server checks tag usage count
    return false; // Server-side check
  },
  
  STATE_X_LINKED: async (context) => {
    // Automatically granted on X OAuth login
    return false; // Handled by database trigger
  },
};

/**
 * Get unlock requirements for presets
 */
export function getPresetUnlockLevel(preset: string): number | null {
  const unlocks: Record<string, number> = {
    HORNY_CORE_SKETCH: 1, // default
    HORNY_META_SCENE: 2,
    HORNY_CHAOS_VARIATION: 4,
  };
  return unlocks[preset] ?? null;
}

/**
 * Get unlock requirements for bases
 */
export function getBaseUnlockLevel(baseId: string): number | null {
  const unlocks: Record<string, number> = {
    "base-01": 1, // default
    "base-02": 2,
    "base-03": 3,
    "base-04": 5,
  };
  return unlocks[baseId] ?? null;
}

