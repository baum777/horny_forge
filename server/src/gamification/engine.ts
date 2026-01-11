import {
  GLOBAL_DAILY_HORNY_CAP,
  GLOBAL_WEEKLY_HORNY_CAP,
  INCENTIVE_RULES,
  LEVEL_CURVE,
  VISIBILITY_BOOSTS,
} from "./incentives";
import type { ActionContext, ActionResult, ActionType, UserStats, VisibilityBoost } from "./types";
import { evaluateNewBadgesAndFeatures } from "../badges/unifiedBadges";

export function getRule(action: ActionType) {
  const rule = INCENTIVE_RULES.find((r) => r.action === action);
  if (!rule) throw new Error(`No IncentiveRule for action: ${action}`);
  return rule;
}

export function computeLevel(lifetimeHornyEarned: number): number {
  let lvl = 1;
  for (const row of LEVEL_CURVE) if (lifetimeHornyEarned >= row.lifetimeHornyEarned) lvl = row.level;
  return lvl;
}

export function getVisibilityBoost(level: number): VisibilityBoost {
  return VISIBILITY_BOOSTS.find((b) => b.level === level) ?? VISIBILITY_BOOSTS[0];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function enforceCaps(opts: {
  proposed: number;
  actionCapDaily?: number;
  actionCapWeekly?: number;
  stats: UserStats;
  actionKey: string;
}): number {
  const { proposed, actionCapDaily, actionCapWeekly, stats, actionKey } = opts;
  if (proposed <= 0) return 0;

  const earnedKeyDaily = `horny_daily_${actionKey}`;
  const earnedKeyWeekly = `horny_weekly_${actionKey}`;
  const alreadyDaily = stats.counts[earnedKeyDaily] ?? 0;
  const alreadyWeekly = stats.counts[earnedKeyWeekly] ?? 0;

  let allowed = proposed;

  if (typeof actionCapDaily === "number") allowed = Math.min(allowed, Math.max(0, actionCapDaily - alreadyDaily));
  if (typeof actionCapWeekly === "number") allowed = Math.min(allowed, Math.max(0, actionCapWeekly - alreadyWeekly));

  allowed = Math.min(allowed, Math.max(0, GLOBAL_DAILY_HORNY_CAP - stats.dailyHornyEarned));
  allowed = Math.min(allowed, Math.max(0, GLOBAL_WEEKLY_HORNY_CAP - stats.weeklyHornyEarned));

  return clamp(allowed, 0, 10_000);
}

export function applyAction(prev: UserStats, action: ActionType, ctx: ActionContext): { next: UserStats; result: ActionResult } {
  const rule = getRule(action);

  if (rule.levelRequirement && prev.level < rule.levelRequirement) {
    const visibilityBoost = getVisibilityBoost(prev.level);
    return {
      next: prev,
      result: {
        deltaHorny: 0,
        newLevel: prev.level,
        visibilityBoost,
        newlyUnlockedBadges: [],
        newlyUnlockedFeatures: [],
        tier: rule.visibility,
      },
    };
  }

  const baseGain = rule.computeGain ? rule.computeGain(ctx) : rule.hornyGain;
  const allowedGain = enforceCaps({
    proposed: baseGain,
    actionCapDaily: rule.hornyCap?.daily,
    actionCapWeekly: rule.hornyCap?.weekly,
    stats: prev,
    actionKey: action,
  });

  const next: UserStats = { ...prev, counts: { ...prev.counts } };

  next.counts[action] = (next.counts[action] ?? 0) + 1;

  const earnedKeyDaily = `horny_daily_${action}`;
  const earnedKeyWeekly = `horny_weekly_${action}`;
  next.counts[earnedKeyDaily] = (next.counts[earnedKeyDaily] ?? 0) + allowedGain;
  next.counts[earnedKeyWeekly] = (next.counts[earnedKeyWeekly] ?? 0) + allowedGain;

  if (action === "votes_received") next.totalVotesReceived += Math.max(0, ctx.receivedVotesDelta ?? 0);
  if (action === "time_spent") next.totalTimeSeconds += Math.max(0, ctx.timeDeltaSeconds ?? 0);
  if (action === "quiz_complete") {
    next.quizClass = ctx.quizClassId ?? next.quizClass;
    if (ctx.quizVector) {
      next.degen = ctx.quizVector.degen;
      next.horny = ctx.quizVector.horny;
      next.conviction = ctx.quizVector.conviction;
    }
    next.counts["quiz_complete"] = (next.counts["quiz_complete"] ?? 0) + 1;
  }

  next.dailyHornyEarned += allowedGain;
  next.weeklyHornyEarned += allowedGain;
  next.lifetimeHornyEarned += allowedGain;

  next.level = computeLevel(next.lifetimeHornyEarned);

  const { newBadges, newFeatures } = evaluateNewBadgesAndFeatures(next);

  const ruleUnlocks = rule.unlocks ?? [];
  for (const u of ruleUnlocks) if (!next.unlockedFeatures.includes(u)) next.unlockedFeatures = [...next.unlockedFeatures, u];

  if (newBadges.length) next.unlockedBadges = [...new Set([...next.unlockedBadges, ...newBadges])];
  if (newFeatures.length) next.unlockedFeatures = [...new Set([...next.unlockedFeatures, ...newFeatures])];

  next.lastActiveISO = ctx.nowISO;

  const visibilityBoost = getVisibilityBoost(next.level);

  return {
    next,
    result: {
      deltaHorny: allowedGain,
      newLevel: next.level,
      visibilityBoost,
      newlyUnlockedBadges: newBadges,
      newlyUnlockedFeatures: [...newFeatures, ...ruleUnlocks.filter((x) => !prev.unlockedFeatures.includes(x))],
      tier: rule.visibility,
    },
  };
}

