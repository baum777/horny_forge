import type { UserStats } from "../gamification/types";

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

type Meta = { dayISO: string; weekISO: string };

class GamificationStore {
  private statsByUser = new Map<string, UserStats>();
  private idemByUser = new Map<string, Set<string>>();
  private metaByUser = new Map<string, Meta>();

  getOrCreate(userId: string, nowISO: string): UserStats {
    const now = new Date(nowISO);
    if (!this.statsByUser.has(userId)) {
      this.statsByUser.set(userId, defaultUserStats(userId));
      this.metaByUser.set(userId, { dayISO: startOfDay(now), weekISO: startOfWeek(now) });
      this.idemByUser.set(userId, new Set());
    }
    const s = this.statsByUser.get(userId)!;
    this.resetIfNeeded(userId, nowISO);
    return this.statsByUser.get(userId)!;
  }

  wasProcessed(userId: string, idemKey: string): boolean {
    return this.idemByUser.get(userId)?.has(idemKey) ?? false;
  }

  markProcessed(userId: string, idemKey: string) {
    if (!this.idemByUser.has(userId)) this.idemByUser.set(userId, new Set());
    this.idemByUser.get(userId)!.add(idemKey);
  }

  save(userId: string, stats: UserStats) {
    this.statsByUser.set(userId, stats);
  }

  private resetIfNeeded(userId: string, nowISO: string) {
    const now = new Date(nowISO);
    const meta = this.metaByUser.get(userId);
    if (!meta) return;

    const dayISO = startOfDay(now);
    const weekISO = startOfWeek(now);

    let s = this.statsByUser.get(userId);
    if (!s) return;

    if (meta.dayISO !== dayISO) {
      // daily reset
      s = { ...s, dailyHornyEarned: 0, counts: { ...s.counts } };

      for (const k of Object.keys(s.counts)) if (k.startsWith("horny_daily_")) s.counts[k] = 0;

      // streak logic: if last active was yesterday => +1 else reset to 1
      if (s.lastActiveISO) {
        const last = new Date(s.lastActiveISO);
        const lastDay = startOfDay(last);
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        const yesterdayISO = startOfDay(y);
        s.currentStreak = lastDay === yesterdayISO ? s.currentStreak + 1 : 1;
      } else {
        s.currentStreak = 1;
      }

      meta.dayISO = dayISO;
      this.statsByUser.set(userId, s);
    }

    if (meta.weekISO !== weekISO) {
      // weekly reset
      s = this.statsByUser.get(userId)!;
      s = { ...s, weeklyHornyEarned: 0, counts: { ...s.counts } };
      for (const k of Object.keys(s.counts)) if (k.startsWith("horny_weekly_")) s.counts[k] = 0;

      meta.weekISO = weekISO;
      this.statsByUser.set(userId, s);
    }

    this.metaByUser.set(userId, meta);
  }
}

export const gamificationStore = new GamificationStore();

