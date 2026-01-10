import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import type { ArchivesUser } from '@/lib/archives/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [archivesUser, setArchivesUser] = useState<ArchivesUser | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile extraction
          setTimeout(() => {
            const metadata = session.user.user_metadata;
            setArchivesUser({
              id: session.user.id,
              email: session.user.email,
              handle: metadata?.user_name || metadata?.preferred_username || metadata?.name || session.user.email?.split('@')[0] || 'Anonymous',
              avatar: metadata?.avatar_url || metadata?.picture || null,
            });
          }, 0);
        } else {
          setArchivesUser(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const metadata = session.user.user_metadata;
        setArchivesUser({
          id: session.user.id,
          email: session.user.email,
          handle: metadata?.user_name || metadata?.preferred_username || metadata?.name || session.user.email?.split('@')[0] || 'Anonymous',
          avatar: metadata?.avatar_url || metadata?.picture || null,
        });
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithTwitter = useCallback(async () => {
    const redirectUrl = `${window.location.origin}/archives`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, handle: string) => {
    const redirectUrl = `${window.location.origin}/archives`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          user_name: handle,
          name: handle,
        },
      },
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
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isAuthenticated: !!user,
  };
}
