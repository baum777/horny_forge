"use client";

import { useAuth } from '@/lib/hooks/useAuth';
import { useArtifacts } from '@/lib/hooks/useArtifacts';
import { useUserStats } from '@/lib/hooks/useUserStats';
import { useUserBadges } from '@/lib/hooks/useUserBadges';
import { useXPEvent } from '@/lib/hooks/useXPEvent';
import NavBar from '@/components/nav/NavBar';
import { GalleryGrid } from '@/components/archives/GalleryGrid';
import { LoginModal } from '@/components/auth/LoginModal';
import { LevelBar } from '@/components/profile/LevelBar';
import { BadgeGrid } from '@/components/profile/BadgeGrid';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flame } from 'lucide-react';

export default function ProfilePage() {
  const { isAuthenticated, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const { stats, loading: statsLoading } = useUserStats();
  const { badges, loading: badgesLoading } = useUserBadges();
  const { triggerEvent } = useXPEvent();

  const { artifacts, loading, hasMore, loadMore } = useArtifacts({
    authorId: profile?.id,
  });

  // Trigger daily_return event on page load (once per day)
  useEffect(() => {
    if (isAuthenticated && profile) {
      const lastDailyReturn = localStorage.getItem(`daily_return_${profile.id}`);
      const today = new Date().toDateString();
      
      if (lastDailyReturn !== today) {
        triggerEvent("daily_return").then((result) => {
          if (result && result.xp_added > 0) {
            localStorage.setItem(`daily_return_${profile.id}`, today);
          }
        }).catch(console.error);
      }
    }
  }, [isAuthenticated, profile, triggerEvent]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowLogin(true);
    }
  }, [isAuthenticated, authLoading]);

  const handleRequiresAuth = useCallback(() => {
    setShowLogin(true);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <LoginModal isOpen={showLogin} onClose={() => {
          setShowLogin(false);
          router.push('/');
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">@{profile.handle}</h1>
              <p className="text-muted-foreground">My Artifacts</p>
            </div>
            {stats && (
              <div className="flex items-center gap-2 text-sm">
                <Flame className="w-5 h-5 text-primary" />
                <span className="font-semibold">{stats.streak_days} day streak</span>
              </div>
            )}
          </div>

          {statsLoading ? (
            <div className="animate-pulse h-20 bg-muted rounded-lg mb-6" />
          ) : stats ? (
            <LevelBar
              level={stats.level}
              xpTotal={stats.xp_total}
              className="mb-6"
            />
          ) : null}

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Badges</h2>
            {badgesLoading ? (
              <div className="animate-pulse h-32 bg-muted rounded-lg" />
            ) : (
              <BadgeGrid badges={badges} />
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">My Artifacts</h2>
        </div>

        <GalleryGrid
          artifacts={artifacts}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onRequiresAuth={handleRequiresAuth}
        />
      </div>
    </div>
  );
}

