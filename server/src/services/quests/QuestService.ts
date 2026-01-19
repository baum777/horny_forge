import { createClient } from '@supabase/supabase-js';
import { config } from '../../config';
import type { Database } from '../../types/supabase';
import { loadQuestConfig, type QuestConfig } from './QuestConfigLoader';
import { VotingBoostService } from './VotingBoostService';

type QuestTierState = 'LOCKED' | 'IN_PROGRESS' | 'ELIGIBLE' | 'CLAIMED' | 'POOL_EMPTY';

type RequirementProgress = {
  type: string;
  op: string;
  target: unknown;
  current: unknown;
  met: boolean;
};

type PathProgress = {
  id: string;
  title: string;
  requirements: RequirementProgress[];
  met: boolean;
};

export type TierProgress = {
  tier: number;
  name: string;
  min_level: number;
  reward_per_claim: number;
  slots_remaining: number;
  state: QuestTierState;
  paths: PathProgress[];
};

export type QuestProgress = {
  week_id: string;
  timezone: string;
  tiers: TierProgress[];
};

type WeekContext = {
  weekId: string;
  weekStart: Date;
  weekEnd: Date;
  config: QuestConfig;
};

type MetricBundle = {
  generate_count: number;
  publish_count: number;
  votes_cast: number;
  best_meme_rating_count: number;
  best_meme_avg_rating: number;
  meme_hidden_count: number;
  meme_reports_max: number;
  ace_mvp_eligible_count: number;
  matrix_flags: Set<string>;
  voting_boost_eligible: boolean;
  voting_score_week: number;
  x_boost_eligible: boolean;
  x_score_week: number;
};

const MS_PER_DAY = 86_400_000;

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }

  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    isoWeekday: weekdayMap[map.weekday] ?? 1,
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return localAsUtc - date.getTime();
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const utcAssumed = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = getTimeZoneOffsetMs(utcAssumed, timeZone);
  return new Date(utcAssumed.getTime() - offset);
}

function getIsoWeekIdFromZoned(now: Date, timeZone: string): string {
  const parts = getZonedParts(now, timeZone);
  const localDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const day = localDate.getUTCDay() || 7;
  localDate.setUTCDate(localDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(localDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((localDate.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7);
  return `${localDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getWeekBounds(now: Date, timeZone: string): { start: Date; end: Date } {
  const parts = getZonedParts(now, timeZone);
  const localMidnight = zonedTimeToUtc(parts.year, parts.month, parts.day, 0, 0, 0, timeZone);
  const dayOffset = parts.isoWeekday - 1;
  const start = new Date(localMidnight.getTime() - dayOffset * MS_PER_DAY);
  const end = new Date(start.getTime() + 7 * MS_PER_DAY);
  return { start, end };
}

export class QuestService {
  private supabase = createClient<Database>(config.supabase.url, config.supabase.serviceRoleKey);
  private votingBoost = new VotingBoostService(this.supabase);

  async getProgress(userId: string): Promise<QuestProgress> {
    const context = await this.getWeekContext();
    await this.ensureWeekTiers(context);

    const userLevel = await this.getUserLevel(userId);
    const claims = await this.getUserClaims(userId, context.weekId);
    const tiers = await this.getWeekTiers(context.weekId);
    const metrics = await this.computeMetrics(userId, context);

    const tierProgress = context.config.tiers.map((tier) => {
      const tierRow = tiers.find((row) => row.tier === tier.tier);
      const slotsRemaining = tierRow?.slots_remaining ?? tier.slots;
      const alreadyClaimed = claims.has(tier.tier);
      const paths = tier.paths.map((path) => {
        const requirements = path.requirements.all.map((req) => {
          const { current, met } = this.evaluateRequirement(req, metrics);
          return {
            type: req.type,
            op: req.op,
            target: req.value,
            current,
            met,
          };
        });
        const met = requirements.every((r) => r.met);
        return {
          id: path.id,
          title: path.title,
          requirements,
          met,
        };
      });

      let state: QuestTierState = 'IN_PROGRESS';
      if (userLevel < tier.min_level) {
        state = 'LOCKED';
      } else if (alreadyClaimed) {
        state = 'CLAIMED';
      } else if (slotsRemaining <= 0) {
        state = 'POOL_EMPTY';
      } else if (paths.some((p) => p.met)) {
        state = 'ELIGIBLE';
      }

      return {
        tier: tier.tier,
        name: tier.name,
        min_level: tier.min_level,
        reward_per_claim: tier.reward_per_claim,
        slots_remaining: slotsRemaining,
        state,
        paths,
      };
    });

    return {
      week_id: context.weekId,
      timezone: context.config.timezone,
      tiers: tierProgress,
    };
  }

  async claimTier(userId: string, tier: number) {
    const context = await this.getWeekContext();
    await this.ensureWeekTiers(context);

    const tierConfig = context.config.tiers.find((t) => t.tier === tier);
    if (!tierConfig) {
      throw new Error('Unknown tier');
    }

    const userLevel = await this.getUserLevel(userId);
    if (userLevel < tierConfig.min_level) {
      throw new Error('Tier locked');
    }

    const claims = await this.getUserClaims(userId, context.weekId);
    if (claims.has(tier)) {
      throw new Error('Already claimed');
    }

    const metrics = await this.computeMetrics(userId, context);
    const eligible = tierConfig.paths.some((path) =>
      path.requirements.all.every((req) => this.evaluateRequirement(req, metrics).met),
    );
    if (!eligible) {
      throw new Error('Not eligible');
    }

    const { totalClaimed, totalBoosted } = await this.getUserWeeklyTotals(userId, context.weekId);

    let boostAmount = 0;
    if (context.config.boosts.enabled) {
      const votingBonus = await this.votingBoost.computeVotingBonus({
        userId,
        weekStart: context.weekStart,
        weekEnd: context.weekEnd,
        config: context.config,
      });
      const boostCap = context.config.claim.user_weekly_boost_cap;
      const remainingCap = Math.max(0, boostCap - totalBoosted);
      const remainingBonus = Math.max(0, votingBonus.totalBonus - totalBoosted);
      boostAmount = Math.min(remainingCap, remainingBonus);
    }

    const newTotal = totalClaimed + tierConfig.reward_per_claim + boostAmount;
    if (newTotal > context.config.claim.user_weekly_cap) {
      throw new Error('Weekly cap exceeded');
    }

    const idempotencyKey = `weekly:${context.weekId}:tier:${tier}:user:${userId}`;
    const { data, error } = await this.supabase.rpc('rpc_claim_weekly_quest', {
      p_week_id: context.weekId,
      p_tier: tier,
      p_user_id: userId,
      p_reward_amount: tierConfig.reward_per_claim,
      p_boost_amount: boostAmount,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      throw new Error('Claim failed');
    }

    if (!data?.success) {
      const reason = data?.error ?? 'Claim failed';
      throw new Error(reason);
    }

    return {
      week_id: context.weekId,
      tier,
      reward_amount: tierConfig.reward_per_claim,
      boost_amount: boostAmount,
      slots_remaining: data.slots_remaining ?? null,
    };
  }

  async getWeekContext(): Promise<WeekContext> {
    const config = await loadQuestConfig();
    const now = new Date();
    const weekId = config.week_id === 'AUTO' ? getIsoWeekIdFromZoned(now, config.timezone) : config.week_id;
    const bounds = getWeekBounds(now, config.timezone);
    return {
      weekId,
      weekStart: bounds.start,
      weekEnd: bounds.end,
      config,
    };
  }

  private async getUserLevel(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('user_stats')
      .select('level')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error('Failed to load user stats');
    }

    return (data as { level: number } | null)?.level ?? 1;
  }

  private async getUserClaims(userId: string, weekId: string): Promise<Set<number>> {
    const { data, error } = await this.supabase
      .from('weekly_quest_claims')
      .select('tier')
      .eq('user_id', userId)
      .eq('week_id', weekId);

    if (error) {
      throw new Error('Failed to load quest claims');
    }

    return new Set((data ?? []).map((row) => row.tier as number));
  }

  private async getWeekTiers(weekId: string) {
    const { data, error } = await this.supabase
      .from('weekly_quest_tiers')
      .select('tier, slots_remaining')
      .eq('week_id', weekId);

    if (error) {
      throw new Error('Failed to load quest tiers');
    }

    return (data ?? []) as { tier: number; slots_remaining: number }[];
  }

  private async ensureWeekTiers(context: WeekContext): Promise<void> {
    const tierRows = context.config.tiers.map((tier) => ({
      week_id: context.weekId,
      tier: tier.tier,
      slots_total: tier.slots,
      slots_remaining: tier.slots,
      pool_total: tier.pool_total,
      reward_per_claim: tier.reward_per_claim,
    }));

    const { error } = await this.supabase
      .from('weekly_quest_tiers')
      .upsert(tierRows, { onConflict: 'week_id,tier', ignoreDuplicates: true });

    if (error) {
      throw new Error('Failed to initialize weekly quest tiers');
    }
  }

  private async computeMetrics(userId: string, context: WeekContext): Promise<MetricBundle> {
    const { weekStart, weekEnd, config } = context;

    const { count: previewCount, error: previewError } = await this.supabase
      .from('forge_previews')
      .select('generation_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString());

    if (previewError) {
      throw new Error('Failed to load preview metrics');
    }

    const generateCount = (previewCount ?? 0) as number;

    const { data: artifacts, error: artifactsError } = await this.supabase
      .from('artifacts')
      .select('id, avg_rating, rating_count, report_count, hidden, matrix_meta, created_at')
      .eq('author_id', userId)
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString());

    if (artifactsError) {
      throw new Error('Failed to load artifacts for quest metrics');
    }

    // Cast artifacts to any[] to avoid strict type checks on never[]
    const safeArtifacts = (artifacts ?? []) as any[];

    const publishCount = safeArtifacts.length ?? 0;
    const ratingCounts = safeArtifacts.map((row) => row.rating_count ?? 0);
    const avgRatings = safeArtifacts.map((row) => row.avg_rating ?? 0);
    const reportCounts = safeArtifacts.map((row) => row.report_count ?? 0);
    const hiddenCount = safeArtifacts.filter((row) => row.hidden).length;
    const bestRatingCount = ratingCounts.length ? Math.max(...ratingCounts) : 0;
    const bestAvgRating = avgRatings.length ? Math.max(...avgRatings) : 0;
    const maxReportCount = reportCounts.length ? Math.max(...reportCounts) : 0;

    const matrixFlags = new Set<string>();
    for (const artifact of safeArtifacts) {
      const meta = artifact.matrix_meta as { flags?: string[] } | null;
      if (meta?.flags && Array.isArray(meta.flags)) {
        for (const flag of meta.flags) matrixFlags.add(flag);
      }
    }

    const thresholds = context.config.thresholds?.ace_mvp ?? {
      avg_rating: 4.2,
      rating_count: 25,
      report_count_max: 3,
    };
    const aceEligibleCount = safeArtifacts.filter((artifact) => {
      const avg = artifact.avg_rating ?? 0;
      const count = artifact.rating_count ?? 0;
      const reports = artifact.report_count ?? 0;
      return (
        avg >= thresholds.avg_rating &&
        count >= thresholds.rating_count &&
        reports < thresholds.report_count_max
      );
    }).length;

    const { count: ratingCount, error: ratingsError } = await this.supabase
      .from('meme_ratings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString());

    if (ratingsError) {
      throw new Error('Failed to load ratings for quest metrics');
    }

    const votesCast = ratingCount ?? 0;

    const votingBoost = await this.votingBoost.computeVotingBoost({
      userId,
      weekStart,
      weekEnd,
      config,
      artifacts: safeArtifacts,
    });

    return {
      generate_count: generateCount,
      publish_count: publishCount,
      votes_cast: votesCast,
      best_meme_rating_count: bestRatingCount,
      best_meme_avg_rating: bestAvgRating,
      meme_hidden_count: hiddenCount,
      meme_reports_max: maxReportCount,
      ace_mvp_eligible_count: aceEligibleCount,
      matrix_flags: matrixFlags,
      voting_boost_eligible: votingBoost.eligible,
      voting_score_week: votingBoost.score,
      x_boost_eligible: false,
      x_score_week: 0,
    };
  }

  private async getUserWeeklyTotals(userId: string, weekId: string): Promise<{ totalClaimed: number; totalBoosted: number }> {
    const { data: claims, error } = await this.supabase
      .from('weekly_quest_claims')
      .select('reward_amount, boost_amount')
      .eq('user_id', userId)
      .eq('week_id', weekId);

    if (error) {
      throw new Error('Failed to load weekly totals');
    }

    const safeClaims = (claims ?? []) as { reward_amount: number; boost_amount: number }[];
    const totalClaimed = safeClaims.reduce((sum, row) => sum + (row.reward_amount ?? 0), 0);
    const totalBoosted = safeClaims.reduce((sum, row) => sum + (row.boost_amount ?? 0), 0);
    return { totalClaimed, totalBoosted };
  }

  private evaluateRequirement(
    requirement: QuestConfig['tiers'][number]['paths'][number]['requirements']['all'][number],
    metrics: MetricBundle,
  ): { current: unknown; met: boolean } {
    if (requirement.type === 'matrix_any') {
      const value = Array.isArray(requirement.value) ? requirement.value : [];
      const current = [...metrics.matrix_flags];
      const met = value.some((flag) => metrics.matrix_flags.has(flag));
      return { current, met };
    }

    const current = (metrics as Record<string, unknown>)[requirement.type];
    const met = this.compare(current, requirement.op, requirement.value);
    return { current, met };
  }

  private compare(current: unknown, op: string, target: unknown): boolean {
    switch (op) {
      case '>=':
        return Number(current) >= Number(target);
      case '<=':
        return Number(current) <= Number(target);
      case '>':
        return Number(current) > Number(target);
      case '<':
        return Number(current) < Number(target);
      case '=':
        return current === target;
      case 'includes': {
        if (!Array.isArray(current) || !Array.isArray(target)) return false;
        return target.some((item) => current.includes(item));
      }
      default:
        return false;
    }
  }
}

