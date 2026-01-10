import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { BadgeId } from 'lib/gamification/badgeRules';

export type UserStats = {
  user_id: string;
  xp_total: number;
  level: number;
  streak_days: number;
  last_active_at: string | null;
};

export type UserBadge = {
  badge_id: BadgeId;
  unlocked_at: string;
};

const EMPTY_STATS: UserStats = {
  user_id: '',
  xp_total: 0,
  level: 1,
  streak_days: 0,
  last_active_at: null,
};

export function useGamification(userId?: string | null) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGamification = useCallback(async () => {
    if (!userId) {
      setStats(null);
      setBadges([]);
      return;
    }
    setLoading(true);

    const { data: statsData } = await supabase
      .from('user_stats')
      .select('user_id, xp_total, level, streak_days, last_active_at')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: badgeData } = await supabase
      .from('user_badges')
      .select('badge_id, unlocked_at')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    setStats(statsData ? (statsData as UserStats) : { ...EMPTY_STATS, user_id: userId });
    setBadges((badgeData ?? []) as UserBadge[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void fetchGamification();
  }, [fetchGamification]);

  return { stats, badges, loading, refresh: fetchGamification };
}
