"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

export interface UserStats {
  user_id: string;
  xp_total: number;
  level: number;
  streak_days: number;
  last_active_at: string;
  updated_at: string;
}

export function useUserStats() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setStats(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchStats() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (cancelled) return;

        if (fetchError) {
          // If stats don't exist, create them
          if (fetchError.code === "PGRST116") {
            const { data: newStats, error: createError } = await supabase
              .from("user_stats")
              .insert({
                user_id: user.id,
                xp_total: 0,
                level: 1,
                streak_days: 0,
                last_active_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (cancelled) return;

            if (createError) {
              throw createError;
            }
            setStats(newStats as UserStats);
          } else {
            throw fetchError;
          }
        } else {
          setStats(data as UserStats);
        }
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Failed to fetch stats"));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    // Subscribe to changes
    const channel = supabase
      .channel(`user_stats:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_stats",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!cancelled) {
            setStats(payload.new as UserStats);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [user, isAuthenticated]);

  return { stats, loading, error };
}

