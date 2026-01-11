"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";
import type { Badge } from "@/components/profile/BadgeGrid";

export function useUserBadges() {
  const { user, isAuthenticated } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setBadges([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchBadges() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("user_badges")
          .select(`
            badge_id,
            unlocked_at,
            badges (
              badge_id,
              name,
              description,
              visual_type,
              rarity
            )
          `)
          .eq("user_id", user.id)
          .order("unlocked_at", { ascending: false });

        if (cancelled) return;

        if (fetchError) {
          throw fetchError;
        }

        // Transform the data
        const transformedBadges: Badge[] = (data ?? []).map((item: any) => ({
          badge_id: item.badge_id,
          name: item.badges?.name ?? item.badge_id,
          description: item.badges?.description ?? "",
          visual_type: item.badges?.visual_type ?? "sigil",
          rarity: item.badges?.rarity ?? "common",
          unlocked_at: item.unlocked_at,
        }));

        setBadges(transformedBadges);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Failed to fetch badges"));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBadges();

    // Subscribe to changes
    const channel = supabase
      .channel(`user_badges:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_badges",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (!cancelled) {
            fetchBadges();
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [user, isAuthenticated]);

  return { badges, loading, error };
}

