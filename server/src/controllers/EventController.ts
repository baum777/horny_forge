import type { Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import type { AuthenticatedRequest } from '../middleware/auth';

const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 10 },
  { level: 3, xp: 30 },
  { level: 4, xp: 70 },
  { level: 5, xp: 130 },
  { level: 6, xp: 220 },
  { level: 7, xp: 350 },
  { level: 8, xp: 520 },
  { level: 9, xp: 750 },
  { level: 10, xp: 1050 },
] as const;

const DAILY_XP_CAP = 100;
const STREAK_BONUS_XP = 5;

const XP_EVENT_CONFIG = {
  forge_generate: { xp: 1, dailyCap: 10 },
  artifact_release: { xp: 3, dailyCap: 5 },
  vote_cast: { xp: 1, dailyCap: 20 },
  vote_received: { xp: 2 },
  share_click: { xp: 2, dailyCap: 10 },
  daily_return: { xp: 2, dailyCap: 1 },
} as const;

type XpEventType = keyof typeof XP_EVENT_CONFIG;

type EventRequestBody = {
  type?: XpEventType;
  artifact_id?: string;
  meta?: Record<string, unknown>;
};

type UserStatsRow = {
  user_id: string;
  xp_total: number | null;
  level: number | null;
  streak_days: number | null;
  last_active_at: string | null;
};

type DailyLimitRow = {
  user_id: string;
  day: string;
  xp_today: number | null;
  counters: Record<string, number> | null;
};

function getLevelFromXp(xpTotal: number): number {
  let current = 1;
  for (const entry of LEVEL_THRESHOLDS) {
    if (xpTotal >= entry.xp) {
      current = entry.level;
    }
  }
  return current;
}

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getYesterdayKey(date: Date): string {
  const yesterday = new Date(date);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return getDateKey(yesterday);
}

export class EventController {
  private supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

  async handle(req: AuthenticatedRequest, res: Response) {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const body = (req.body ?? {}) as EventRequestBody;
    const type = body.type;
    if (!type || !(type in XP_EVENT_CONFIG)) {
      return res.status(400).json({ error: 'Invalid event type', code: 'INVALID_EVENT' });
    }

    let targetUserId = req.userId;
    let artifactData: { author_id: string; votes_count: number; tags: string[] } | null = null;

    if (type === 'vote_received') {
      if (!body.artifact_id) {
        return res.status(400).json({ error: 'artifact_id required', code: 'MISSING_ARTIFACT' });
      }
      const { data, error } = await this.supabase
        .from('artifacts')
        .select('author_id, votes_count, tags')
        .eq('id', body.artifact_id)
        .maybeSingle();

      if (error || !data) {
        return res.status(404).json({ error: 'Artifact not found', code: 'ARTIFACT_NOT_FOUND' });
      }

      artifactData = data as { author_id: string; votes_count: number; tags: string[] };
      targetUserId = data.author_id;
    }

    const now = new Date();
    const todayKey = getDateKey(now);

    const { data: statsData, error: statsError } = await this.supabase
      .from('user_stats')
      .select('user_id, xp_total, level, streak_days, last_active_at')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (statsError) {
      return res.status(500).json({ error: 'Failed to load user stats', code: 'STATS_LOAD_FAILED' });
    }

    let stats: UserStatsRow =
      (statsData as UserStatsRow) ?? {
        user_id: targetUserId,
        xp_total: 0,
        level: 1,
        streak_days: 0,
        last_active_at: null,
      };

    if (!statsData) {
      const { error } = await this.supabase.from('user_stats').insert({
        user_id: targetUserId,
        xp_total: 0,
        level: 1,
        streak_days: 0,
        last_active_at: null,
      });
      if (error) {
        return res.status(500).json({ error: 'Failed to create user stats', code: 'STATS_CREATE_FAILED' });
      }
    }

    const { data: limitData, error: limitError } = await this.supabase
      .from('user_daily_limits')
      .select('user_id, day, xp_today, counters')
      .eq('user_id', targetUserId)
      .eq('day', todayKey)
      .maybeSingle();

    if (limitError) {
      return res.status(500).json({ error: 'Failed to load daily limits', code: 'LIMITS_LOAD_FAILED' });
    }

    let dailyLimit: DailyLimitRow =
      (limitData as DailyLimitRow) ?? {
        user_id: targetUserId,
        day: todayKey,
        xp_today: 0,
        counters: {},
      };

    if (!limitData) {
      const { error } = await this.supabase.from('user_daily_limits').insert({
        user_id: targetUserId,
        day: todayKey,
        xp_today: 0,
        counters: {},
      });
      if (error) {
        return res
          .status(500)
          .json({ error: 'Failed to create daily limits', code: 'LIMITS_CREATE_FAILED' });
      }
    }

    const counters = { ...(dailyLimit.counters ?? {}) } as Record<string, number>;
    const eventConfig = XP_EVENT_CONFIG[type];
    const eventCount = counters[type] ?? 0;

    let xpAdded = 0;
    if (!eventConfig.dailyCap || eventCount < eventConfig.dailyCap) {
      xpAdded = eventConfig.xp;
    }

    let streakDays = stats.streak_days ?? 0;
    if (type === 'daily_return') {
      const lastActiveDate = stats.last_active_at ? getDateKey(new Date(stats.last_active_at)) : null;
      if (lastActiveDate === todayKey) {
        streakDays = stats.streak_days ?? 0;
      } else if (lastActiveDate === getYesterdayKey(now)) {
        streakDays = (stats.streak_days ?? 0) + 1;
      } else {
        streakDays = 1;
      }
    }

    const xpToday = dailyLimit.xp_today ?? 0;
    const available = Math.max(0, DAILY_XP_CAP - xpToday);
    xpAdded = Math.max(0, Math.min(xpAdded, available));

    let bonusAdded = 0;
    if (type === 'daily_return' && streakDays > 0 && streakDays % 7 === 0) {
      const remaining = Math.max(0, available - xpAdded);
      bonusAdded = Math.min(STREAK_BONUS_XP, remaining);
    }

    const totalAdded = xpAdded + bonusAdded;
    const newXpTotal = (stats.xp_total ?? 0) + totalAdded;
    const newLevel = getLevelFromXp(newXpTotal);

    counters[type] = eventCount + 1;
    if (bonusAdded > 0) {
      counters.streak_bonus = (counters.streak_bonus ?? 0) + 1;
    }

    const nextXpToday = Math.min(DAILY_XP_CAP, xpToday + totalAdded);
    const lastActiveAt = now.toISOString();

    const { error: updateStatsError } = await this.supabase
      .from('user_stats')
      .update({
        xp_total: newXpTotal,
        level: newLevel,
        streak_days: streakDays,
        last_active_at: lastActiveAt,
        updated_at: lastActiveAt,
      })
      .eq('user_id', targetUserId);

    if (updateStatsError) {
      return res.status(500).json({ error: 'Failed to update stats', code: 'STATS_UPDATE_FAILED' });
    }

    const { error: updateLimitsError } = await this.supabase
      .from('user_daily_limits')
      .update({
        xp_today: nextXpToday,
        counters,
        updated_at: lastActiveAt,
      })
      .eq('user_id', targetUserId)
      .eq('day', todayKey);

    if (updateLimitsError) {
      return res.status(500).json({ error: 'Failed to update daily limits', code: 'LIMITS_UPDATE_FAILED' });
    }

    const { data: existingBadges } = await this.supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', targetUserId);

    const existingSet = new Set((existingBadges ?? []).map((badge) => badge.badge_id));
    const newBadges: string[] = [];

    const awardBadge = (badgeId: string) => {
      if (!existingSet.has(badgeId)) {
        existingSet.add(badgeId);
        newBadges.push(badgeId);
      }
    };

    if (type === 'forge_generate') awardBadge('SIGIL_FIRST_INFUSION');
    if (type === 'artifact_release') awardBadge('SIGIL_FIRST_RELEASE');
    if (type === 'vote_cast') awardBadge('SIGIL_FIRST_VOTE');

    if (type === 'daily_return') {
      if (streakDays >= 2) awardBadge('FRAGMENT_RETURN_2D');
      if (streakDays >= 7) awardBadge('FRAGMENT_RETURN_7D');
    }

    if (type === 'vote_received' && artifactData) {
      if (artifactData.votes_count >= 10) awardBadge('STAMP_TREND_SPARK');
      if (artifactData.votes_count >= 25) awardBadge('STAMP_FEED_DOMINATOR');
    }

    if (type === 'artifact_release') {
      const tagBadgePairs: Array<{ tag: string; badge: string }> = [
        { tag: '#CroisHorney', badge: 'OBJECT_CROISHORNEY' },
        { tag: '#EichHorney', badge: 'OBJECT_EICHHORNEY' },
        { tag: '#BrainHorney', badge: 'OBJECT_BRAINHORNEY' },
      ];

      for (const pair of tagBadgePairs) {
        if (existingSet.has(pair.badge)) continue;
        const { count } = await this.supabase
          .from('artifacts')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', targetUserId)
          .contains('tags', [pair.tag]);

        if ((count ?? 0) >= 3) {
          awardBadge(pair.badge);
        }
      }
    }

    if (newBadges.length > 0) {
      const { error: badgeInsertError } = await this.supabase
        .from('user_badges')
        .upsert(
          newBadges.map((badgeId) => ({
            user_id: targetUserId,
            badge_id: badgeId,
          })),
          { onConflict: 'user_id,badge_id' }
        );

      if (badgeInsertError) {
        return res.status(500).json({ error: 'Failed to award badges', code: 'BADGE_UPDATE_FAILED' });
      }
    }

    return res.json({
      xp_added: totalAdded,
      new_level: newLevel,
      new_badges: newBadges,
      xp_total: newXpTotal,
      level: newLevel,
      streak_days: streakDays,
    });
  }
}
