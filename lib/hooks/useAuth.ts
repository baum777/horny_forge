import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "lib/supabase/client";
import type { ArchivesUser } from "@/lib/archives/types";
import { postGamificationEvent } from "@/lib/api/event";

const DAILY_RETURN_KEY = "horny_daily_return";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getPreferredHandle(user: User): string {
  const md = user.user_metadata ?? {};
  return (
    md.user_name ||
    md.preferred_username ||
    md.name ||
    md.full_name ||
    user.email?.split("@")[0] ||
    "Anonymous"
  );
}

function getAvatarUrl(user: User): string | null {
  const md = user.user_metadata ?? {};
  return (md.avatar_url || md.picture || null) as string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [archivesUser, setArchivesUser] = useState<ArchivesUser | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      setArchivesUser(
        nextUser
          ? {
              id: nextUser.id,
              email: nextUser.email,
              handle: getPreferredHandle(nextUser),
              avatar: getAvatarUrl(nextUser),
            }
          : null
      );
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
        const initialUser = initialSession?.user ?? null;
        setUser(initialUser);
        setArchivesUser(
          initialUser
            ? {
                id: initialUser.id,
                email: initialUser.email,
                handle: getPreferredHandle(initialUser),
                avatar: getAvatarUrl(initialUser),
              }
            : null
        );
      })
      .finally(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    const todayKey = getTodayKey();
    const lastReturn = localStorage.getItem(DAILY_RETURN_KEY);
    if (lastReturn === todayKey) return;

    void postGamificationEvent({
      event_id: crypto.randomUUID(),
      type: "daily_return",
    }).then(({ error }) => {
      if (!error) {
        localStorage.setItem(DAILY_RETURN_KEY, todayKey);
      }
    });
  }, [session]);

  const signInWithTwitter = useCallback(async () => {
    const redirectUrl = `${window.location.origin}/archives`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: { redirectTo: redirectUrl },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  return {
    user,
    session,
    archivesUser,
    loading,
    signInWithTwitter,
    signOut,
    isAuthenticated: !!user,
  };
}
