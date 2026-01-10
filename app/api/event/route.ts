import { createClient } from '@supabase/supabase-js';
import { DAILY_XP_CAP, STREAK_BONUS_XP, XP_EVENT_CONFIG, type XpEventType } from 'lib/gamification/xp';
import { getLevelFromXp } from 'lib/gamification/levels';

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

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getYesterdayKey(date: Date): string {
  const yesterday = new Date(date);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return getDateKey(yesterday);
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase service role credentials.');
  }
  return createClient(url, key);
}

export async function POST(request: Request) {
  const supabase = getSupabaseClient();
  const body = (await request.json().catch(() => ({}))) as EventRequestBody;
  const type = body.type;

  if (!type || !(type in XP_EVENT_CONFIG)) {
    return new Response(JSON.stringify({ error: 'Invalid event type' }), { status: 400 });
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
  }

  let targetUserId = userData.user.id;
  let artifactData: { author_id: string; votes_count: number; tags: string[] } | null = null;

  if (type === 'vote_received') {
    if (!body.artifact_id) {
      return new Response(JSON.stringify({ error: 'artifact_id required' }), { status: 400 });
    }
    const { data } = await supabase
      .from('artifacts')
      .select('author_id, votes_count, tags')
      .eq('id', body.artifact_id)
      .maybeSingle();

    if (!data) {
      return new Response(JSON.stringify({ error: 'Artifact not found' }), { status: 404 });
    }

    artifactData = data as { author_id: string; votes_count: number; tags: string[] };
    targetUserId = data.author_id;
  }

  const now = new Date();
  const todayKey = getDateKey(now);

  const { data: statsData } = await supabase
    .from('user_stats')
    .select('user_id, xp_total, level, streak_days, last_active_at')
    .eq('user_id', targetUserId)
    .maybeSingle();

  let stats: UserStatsRow =
    (statsData as UserStatsRow) ?? {
      user_id: targetUserId,
      xp_total: 0,
      level: 1,
      streak_days: 0,
      last_active_at: null,
    };

  if (!statsData) {
    await supabase.from('user_stats').insert({
      user_id: targetUserId,
      xp_total: 0,
      level: 1,
      streak_days: 0,
      last_active_at: null,
    });
  }

  const { data: limitData } = await supabase
    .from('user_daily_limits')
    .select('user_id, day, xp_today, counters')
    .eq('user_id', targetUserId)
    .eq('day', todayKey)
    .maybeSingle();

  let dailyLimit: DailyLimitRow =
    (limitData as DailyLimitRow) ?? {
      user_id: targetUserId,
      day: todayKey,
      xp_today: 0,
      counters: {},
    };

  if (!limitData) {
    await supabase.from('user_daily_limits').insert({
      user_id: targetUserId,
      day: todayKey,
      xp_today: 0,
      counters: {},
    });
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

  await supabase
    .from('user_stats')
    .update({
      xp_total: newXpTotal,
      level: newLevel,
      streak_days: streakDays,
      last_active_at: lastActiveAt,
      updated_at: lastActiveAt,
    })
    .eq('user_id', targetUserId);

  await supabase
    .from('user_daily_limits')
    .update({
      xp_today: nextXpToday,
      counters,
      updated_at: lastActiveAt,
    })
    .eq('user_id', targetUserId)
    .eq('day', todayKey);

  const { data: existingBadges } = await supabase
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
      const { count } = await supabase
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
    await supabase.from('user_badges').upsert(
      newBadges.map((badgeId) => ({
        user_id: targetUserId,
        badge_id: badgeId,
      })),
      { onConflict: 'user_id,badge_id' }
    );
  }

  return new Response(
    JSON.stringify({
      xp_added: totalAdded,
      new_level: newLevel,
      new_badges: newBadges,
      xp_total: newXpTotal,
      level: newLevel,
      streak_days: streakDays,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
