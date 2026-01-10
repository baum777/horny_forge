import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ArchivesNavbar } from '@/components/archives/ArchivesNavbar';
import { VoteButton } from '@/components/archives/VoteButton';
import { SharePanel } from '@/components/archives/SharePanel';
import { ArtifactCard } from '@/components/archives/ArtifactCard';
import { ArchivesLoginModal } from '@/components/archives/ArchivesLoginModal';
import { TokenPulsePanel } from '@/components/archives/TokenPulsePanel';
import { useArtifact, useArtifacts } from '@/hooks/useArtifacts';
import Footer from '@/components/layout/Footer';

export default function ArtifactDetail() {
  const { id } = useParams<{ id: string }>();
  const { artifact, loading, error } = useArtifact(id);
  const [showLogin, setShowLogin] = useState(false);

  // Fetch more from same author
  const { artifacts: moreFromAuthor } = useArtifacts({
    authorId: artifact?.author_id,
    limit: 4,
  });

  const filteredMoreFromAuthor = moreFromAuthor.filter(a => a.id !== artifact?.id).slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ArchivesNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !artifact) {
    return (
      <div className="min-h-screen bg-background">
        <ArchivesNavbar />
        <div className="container mx-auto px-4 pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Artifact not found</h1>
          <p className="text-muted-foreground mb-8">
            This artifact may have dissolved into the void.
          </p>
          <Link
            to="/archives"
            className="text-primary hover:underline inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Archives
          </Link>
        </div>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(artifact.created_at), { addSuffix: true });

  return (
    <div className="min-h-screen bg-background">
      <ArchivesNavbar />

      <div className="container mx-auto px-4 pt-24 pb-20">
        {/* Back link */}
        <Link
          to="/archives"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Archives
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="glass-card rounded-2xl overflow-hidden">
              <img
                src={artifact.image_url}
                alt={artifact.caption}
                className="w-full h-auto object-contain max-h-[70vh]"
              />
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Author */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-3">
                {artifact.author_avatar ? (
                  <img
                    src={artifact.author_avatar}
                    alt={artifact.author_handle || 'Author'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-destructive" />
                )}
                <div>
                  <p className="font-semibold">{artifact.author_handle || 'Anonymous'}</p>
                  <p className="text-sm text-muted-foreground">{timeAgo}</p>
                </div>
              </div>
            </div>

            {/* Caption */}
            <div className="glass-card p-4 rounded-xl">
              <p className="text-lg">{artifact.caption}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {artifact.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/archives?tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors shadow-[0_0_10px_rgba(236,72,153,0.2)]"
                >
                  {tag}
                </Link>
              ))}
            </div>

            {/* Vote */}
            <div className="flex items-center gap-4">
              <VoteButton
                artifactId={artifact.id}
                initialVotesCount={artifact.votes_count}
                onRequiresAuth={() => setShowLogin(true)}
                size="lg"
              />
            </div>

            {/* Share */}
            <SharePanel
              artifactId={artifact.id}
              caption={artifact.caption}
            />

            {/* Token Pulse Panel */}
            <TokenPulsePanel />
          </motion.div>
        </div>

        {/* More from author */}
        {filteredMoreFromAuthor.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold mb-6">
              More from {artifact.author_handle || 'this creator'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMoreFromAuthor.map((a) => (
                <ArtifactCard
                  key={a.id}
                  artifact={a}
                  onRequiresAuth={() => setShowLogin(true)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />

      <ArchivesLoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
