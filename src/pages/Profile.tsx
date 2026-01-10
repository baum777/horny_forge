import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image, Heart, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ArchivesNavbar } from '@/components/archives/ArchivesNavbar';
import { GalleryGrid } from '@/components/archives/GalleryGrid';
import { useAuth } from '@/hooks/useAuth';
import { useArtifacts } from '@/hooks/useArtifacts';
import Footer from '@/components/layout/Footer';

export default function Profile() {
  const navigate = useNavigate();
  const { archivesUser, isAuthenticated, loading: authLoading } = useAuth();

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

  return (
    <div className="min-h-screen bg-background">
      <ArchivesNavbar />

      <div className="container mx-auto px-4 pt-24 pb-20">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            {archivesUser.avatar ? (
              <img
                src={archivesUser.avatar}
                alt={archivesUser.handle}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-destructive ring-4 ring-primary/20" />
            )}

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{archivesUser.handle}</h1>
              <p className="text-muted-foreground">{archivesUser.email}</p>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-2xl font-bold">
                  <Image className="w-5 h-5 text-primary" />
                  {artifacts.length}
                </div>
                <p className="text-xs text-muted-foreground">Artifacts</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-2xl font-bold">
                  <Heart className="w-5 h-5 text-primary" />
                  {totalVotes}
                </div>
                <p className="text-xs text-muted-foreground">Total Votes</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* My Artifacts */}
        <section>
          <h2 className="text-xl font-bold mb-6">My Artifacts</h2>
          
          {artifacts.length === 0 && !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 rounded-2xl text-center"
            >
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-2">No artifacts yet</h3>
              <p className="text-muted-foreground mb-4">
                Your creative journey awaits. Infuse the Archives with your first artifact.
              </p>
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
  );
}
