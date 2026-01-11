import type { IncentiveRule, VisibilityBoost } from "./types";

export const LEVEL_CURVE: Array<{ level: number; lifetimeHornyEarned: number }> = [
  { level: 1, lifetimeHornyEarned: 0 },
  { level: 2, lifetimeHornyEarned: 100 },
  { level: 3, lifetimeHornyEarned: 300 },
  { level: 4, lifetimeHornyEarned: 700 },
  { level: 5, lifetimeHornyEarned: 1500 },
  { level: 6, lifetimeHornyEarned: 3000 },
  { level: 7, lifetimeHornyEarned: 6000 },
  { level: 8, lifetimeHornyEarned: 12000 },
  { level: 9, lifetimeHornyEarned: 25000 },
  { level: 10, lifetimeHornyEarned: 50000 },
];

export const VISIBILITY_BOOSTS: VisibilityBoost[] = [
  { level: 1, feedWeight: 1.0, features: [] },
  { level: 2, feedWeight: 1.05, features: [] },
  { level: 3, feedWeight: 1.1, features: ["subtle_glow"] },
  { level: 4, feedWeight: 1.2, features: ["subtle_glow"] },
  { level: 5, feedWeight: 1.3, features: ["glow_effect", "verified_mark"] },
  { level: 6, feedWeight: 1.45, features: ["glow_effect", "verified_mark"] },
  { level: 7, feedWeight: 1.6, features: ["glow_effect", "verified_mark", "highlight_chance"] },
  { level: 8, feedWeight: 1.75, features: ["highlight_chance", "creator_frame"] },
  { level: 9, feedWeight: 1.9, features: ["creator_frame", "viral_slot_chance"] },
  { level: 10, feedWeight: 2.1, features: ["mythic_aura", "viral_slot_chance"] },
];

export const GLOBAL_DAILY_HORNY_CAP = 150;
export const GLOBAL_WEEKLY_HORNY_CAP = 600;

export const INCENTIVE_RULES: IncentiveRule[] = [
  { action: "vote", hornyGain: 2, hornyCap: { daily: 20 }, visibility: "semi" },
  { action: "comment", hornyGain: 2, hornyCap: { daily: 15 }, visibility: "semi" },
  { action: "share", hornyGain: 5, hornyCap: { daily: 10 }, visibility: "public" },
  { action: "follow", hornyGain: 1, hornyCap: { daily: 20 }, visibility: "semi" },

  { action: "forge", hornyGain: 5, hornyCap: { daily: 30 }, visibility: "semi", unlocks: ["forge_preset_pack_1"] },
  { action: "artifact_release", hornyGain: 10, hornyCap: { daily: 50 }, visibility: "public" },
  { action: "meme_create", hornyGain: 5, hornyCap: { daily: 30 }, visibility: "semi" },

  {
    action: "votes_received",
    hornyGain: 0,
    visibility: "public",
    hornyCap: { daily: 100 },
    computeGain: (ctx) => Math.max(0, (ctx.receivedVotesDelta ?? 0) * 1),
  },
  {
    action: "time_spent",
    hornyGain: 0,
    visibility: "private",
    hornyCap: { daily: 20 },
    computeGain: (ctx) => Math.floor(Math.max(0, ctx.timeDeltaSeconds ?? 0) / 60),
  },

  { action: "quiz_complete", hornyGain: 25, visibility: "semi", hornyCap: { weekly: 50 } },
  { action: "streak_tick", hornyGain: 3, visibility: "private", hornyCap: { daily: 10 } },

  { action: "special", hornyGain: 0, visibility: "private" },
];

