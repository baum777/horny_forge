import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image, Heart, Upload } from 'lucide-react';
import { ArchivesNavbar } from '@/components/archives/ArchivesNavbar';
import { GalleryGrid } from '@/components/archives/GalleryGrid';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useArtifacts } from '@/hooks/useArtifacts';
import Footer from '@/components/layout/Footer';
import { useGamification } from '@/hooks/useGamification';
import { LevelBar } from '@/components/profile/LevelBar';
import { BadgeGrid } from '@/components/profile/BadgeGrid';
import { PageShell } from '@/components/layout/PageShell';
import { useCopy } from '@/lib/theme/copy';

export default function Profile() {
  const t = useCopy();
  const navigate = useNavigate();
  const { archivesUser, isAuthenticated, loading: authLoading } = useAuth();
  const { stats, badges } = useGamification(archivesUser?.id);

  const { artifacts, loading, hasMore, loadMore } = useArtifacts({
    authorId: archivesUser?.id,
    limit: 12,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/archives');
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ArchivesNavbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-6 w-32 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!archivesUser) {
    return null;
  }

  const totalVotes = artifacts.reduce((sum, a) => sum + a.votes_count, 0);
  const level = stats?.level ?? 1;
  const xpTotal = stats?.xp_total ?? 0;
  const streakDays = stats?.streak_days ?? 0;

  return (
    <PageShell
      spec={{
        page: "profile",
        flavor: "subtle",
        energy: 3,
        tier: "user-tier",
      }}
    >
      <div className="min-h-screen bg-background">
        <ArchivesNavbar />

        <div className="container mx-auto px-4 pt-24 pb-20">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-2xl mb-8 neon-border"
          >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            {archivesUser.avatar ? (
              <img
                src={archivesUser.avatar}
                alt={archivesUser.handle}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/30 shadow-[0_0_20px_rgba(236,72,153,0.3)]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-destructive ring-4 ring-primary/30 shadow-[0_0_20px_rgba(236,72,153,0.3)]" />
            )}

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gradient">{archivesUser.handle}</h1>
              <p className="text-muted-foreground text-sm mt-1">{t('profile.tagline')}</p>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-3xl font-bold">
                  <Image className="w-6 h-6 text-primary" />
                  {artifacts.length}
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{t('profile.stats.artifacts')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-3xl font-bold">
                  <Heart className="w-6 h-6 text-primary fill-primary" />
                  {totalVotes}
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{t('profile.stats.votes')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[2fr,1fr] gap-6 mb-10">
          <LevelBar xpTotal={xpTotal} level={level} />
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('profile.streak.title')}</p>
              <p className="text-3xl font-bold text-gradient mt-2">{t('profile.streak.value', { days: streakDays })}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {t('profile.streak.subtitle')}
              </p>
            </div>
            <div className="text-xs text-muted-foreground mt-6">
              {t('profile.streak.note')}
            </div>
          </div>
        </div>

        <div className="mb-10">
          <BadgeGrid unlockedBadges={badges.map((badge) => badge.badge_id)} />
        </div>

        {/* My Artifacts */}
        <section>
          <h2 className="text-xl font-bold mb-6">{t('profile.artifacts.title')}</h2>
          
          {artifacts.length === 0 && !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 rounded-2xl text-center"
            >
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-2">{t('profile.artifacts.emptyTitle')}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t('profile.artifacts.emptyBody')}
              </p>
              <Link to="/archives">
                <Button variant="gradient" className="gap-2">
                  <Upload className="w-4 h-4" />
                  {t('profile.artifacts.cta')}
                </Button>
              </Link>
            </motion.div>
          ) : (
            <GalleryGrid
              artifacts={artifacts}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onRequiresAuth={() => {}}
            />
          )}
        </section>
        </div>

        <Footer />
      </div>
    </PageShell>
  );
}
