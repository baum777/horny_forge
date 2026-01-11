import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { config } from '../config';
import type { UserStats } from '../gamification/types';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

export function defaultUserStats(userId: string): UserStats {
  return {
    userId,
    counts: {},
    totalVotesReceived: 0,
    totalTimeSeconds: 0,
    currentStreak: 0,
    lastActiveISO: undefined,
    lifetimeHornyEarned: 0,
    dailyHornyEarned: 0,
    weeklyHornyEarned: 0,
    level: 1,
    unlockedBadges: [],
    unlockedFeatures: [],
  };
}

function dbToUserStats(row: any): UserStats {
  return {
    userId: row.user_id,
    counts: row.counts || {},
    totalVotesReceived: row.total_votes_received || 0,
    totalTimeSeconds: row.total_time_seconds || 0,
    quizClass: row.quiz_class,
    degen: row.degen,
    horny: row.horny,
    conviction: row.conviction,
    currentStreak: row.current_streak || 0,
    lastActiveISO: row.last_active_at ? new Date(row.last_active_at).toISOString() : undefined,
    lifetimeHornyEarned: row.lifetime_horny_earned || 0,
    dailyHornyEarned: row.daily_horny_earned || 0,
    weeklyHornyEarned: row.weekly_horny_earned || 0,
    level: row.level || 1,
    unlockedBadges: row.unlocked_badges || [],
    unlockedFeatures: row.unlocked_features || [],
  };
}

function userStatsToDb(stats: UserStats): any {
  return {
    user_id: stats.userId,
    level: stats.level,
    lifetime_horny_earned: stats.lifetimeHornyEarned,
    daily_horny_earned: stats.dailyHornyEarned,
    weekly_horny_earned: stats.weeklyHornyEarned,
    current_streak: stats.currentStreak,
    last_active_at: stats.lastActiveISO ? new Date(stats.lastActiveISO).toISOString() : null,
    quiz_class: stats.quizClass,
    degen: stats.degen,
    horny: stats.horny,
    conviction: stats.conviction,
    counts: stats.counts,
    total_votes_received: stats.totalVotesReceived,
    total_time_seconds: stats.totalTimeSeconds,
    unlocked_badges: stats.unlockedBadges,
    unlocked_features: stats.unlockedFeatures,
  };
}

export class GamificationStoreSupabase {
  private supabase;

  constructor() {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase credentials not configured');
    }
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }

  async getOrCreate(userId: string, nowISO: string): Promise<UserStats> {
    const now = new Date(nowISO);
    
    // Try to get existing stats
    const { data: existing, error: fetchError } = await this.supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      const stats = dbToUserStats(existing);
      await this.resetIfNeeded(userId, nowISO);
      // Re-fetch after reset
      const { data: updated } = await this.supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      return updated ? dbToUserStats(updated) : stats;
    }

    // Create new stats
    const defaultStats = defaultUserStats(userId);
    const { data: created, error: createError } = await this.supabase
      .from('user_stats')
      .insert(userStatsToDb(defaultStats))
      .select()
      .single();

    if (createError) throw createError;
    return dbToUserStats(created!);
  }

  async wasProcessed(userId: string, idemKey: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('idempotency_keys')
      .select('idem_key')
      .eq('user_id', userId)
      .eq('idem_key', idemKey)
      .single();

    return !!data && !error;
  }

  async getCachedResponse(userId: string, idemKey: string): Promise<{ stats: UserStats; result: any } | null> {
    const { data, error } = await this.supabase
      .from('idempotency_keys')
      .select('response_cache')
      .eq('user_id', userId)
      .eq('idem_key', idemKey)
      .single();

    if (error || !data?.response_cache) return null;
    return data.response_cache as { stats: UserStats; result: any };
  }

  async markProcessed(
    userId: string,
    idemKey: string,
    action: string,
    eventId: string,
    responseCache?: { stats: UserStats; result: any }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('idempotency_keys')
      .insert({
        user_id: userId,
        idem_key: idemKey,
        action,
        event_id: eventId,
        response_cache: responseCache || null,
      });

    if (error) throw error;
  }

  async save(userId: string, stats: UserStats): Promise<void> {
    const { error } = await this.supabase
      .from('user_stats')
      .upsert(userStatsToDb(stats), {
        onConflict: 'user_id',
      });

    if (error) throw error;
  }

  async saveWithTransaction(
    userId: string,
    stats: UserStats,
    eventData: {
      action: string;
      payload: any;
      deltaHorny: number;
      levelBefore: number;
      levelAfter: number;
      capsApplied: any;
      badgesUnlocked: string[];
      featuresUnlocked: string[];
      status: 'applied' | 'rejected';
      rejectReason?: string;
    }
  ): Promise<string> {
    // Use RPC or multiple queries in transaction
    // For now, we'll use sequential queries (Supabase handles transactions via RPC)
    const eventId = nanoid();

    // Insert event first
    const { data: event, error: eventError } = await this.supabase
      .from('gamification_events')
      .insert({
        id: eventId,
        user_id: userId,
        action: eventData.action,
        payload: eventData.payload,
        delta_horny: eventData.deltaHorny,
        level_before: eventData.levelBefore,
        level_after: eventData.levelAfter,
        caps_applied: eventData.capsApplied,
        badges_unlocked: eventData.badgesUnlocked,
        features_unlocked: eventData.featuresUnlocked,
        status: eventData.status,
        reject_reason: eventData.rejectReason || null,
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // Update stats
    await this.save(userId, stats);

    return eventId;
  }

  private async resetIfNeeded(userId: string, nowISO: string): Promise<void> {
    const now = new Date(nowISO);
    const dayISO = startOfDay(now);
    const weekISO = startOfWeek(now);

    const { data: stats } = await this.supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!stats) return;

    const lastResetDay = stats.counts?.horny_daily_reset_at
      ? new Date((stats.counts.horny_daily_reset_at as number) * 1000)
      : null;
    const lastResetWeek = stats.counts?.horny_weekly_reset_at
      ? new Date((stats.counts.horny_weekly_reset_at as number) * 1000)
      : null;

    const needsDailyReset = !lastResetDay || startOfDay(lastResetDay) !== dayISO;
    const needsWeeklyReset = !lastResetWeek || startOfWeek(lastResetWeek) !== weekISO;

    if (needsDailyReset || needsWeeklyReset) {
      const updates: any = {};
      const newCounts = { ...stats.counts };

      if (needsDailyReset) {
        updates.daily_horny_earned = 0;
        newCounts.horny_daily_reset_at = Math.floor(now.getTime() / 1000);
        // Reset daily counters
        for (const key in newCounts) {
          if (key.startsWith('horny_daily_')) {
            newCounts[key] = 0;
          }
        }

        // Streak logic
        if (stats.last_active_at) {
          const last = new Date(stats.last_active_at);
          const lastDay = startOfDay(last);
          const y = new Date(now);
          y.setDate(y.getDate() - 1);
          const yesterdayISO = startOfDay(y);
          updates.current_streak = lastDay === yesterdayISO ? (stats.current_streak || 0) + 1 : 1;
        } else {
          updates.current_streak = 1;
        }
      }

      if (needsWeeklyReset) {
        updates.weekly_horny_earned = 0;
        newCounts.horny_weekly_reset_at = Math.floor(now.getTime() / 1000);
        // Reset weekly counters
        for (const key in newCounts) {
          if (key.startsWith('horny_weekly_')) {
            newCounts[key] = 0;
          }
        }
      }

      updates.counts = newCounts;

      await this.supabase
        .from('user_stats')
        .update(updates)
        .eq('user_id', userId);
    }
  }

  async enqueuePayout(
    userId: string,
    amount: number,
    idempotencyKey: string,
    eventId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('payout_jobs')
      .insert({
        user_id: userId,
        amount,
        idempotency_key: idempotencyKey,
        event_id: eventId,
        status: 'pending',
      });

    if (error) throw error;
  }
}

