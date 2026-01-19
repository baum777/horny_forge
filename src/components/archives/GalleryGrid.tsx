import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ArtifactCard } from './ArtifactCard';
import { Button } from '@/components/ui/button';
import type { Artifact } from '@/lib/archives/types';
import { useCopy } from '@/lib/theme/copy';

interface GalleryGridProps {
  artifacts: Artifact[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRequiresAuth: () => void;
}

export function GalleryGrid({
  artifacts,
  loading,
  hasMore,
  onLoadMore,
  onRequiresAuth,
}: GalleryGridProps) {
  const t = useCopy();
  if (!loading && artifacts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <div className="text-6xl mb-4">🔮</div>
        <h3 className="text-xl font-bold mb-2">{t('gallery.empty.title')}</h3>
        <p className="text-muted-foreground mb-1">{t('gallery.empty.hot')}</p>
        <p className="text-muted-foreground">{t('gallery.empty.new')}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {artifacts.map((artifact) => (
          <ArtifactCard
            key={artifact.id}
            artifact={artifact}
            onRequiresAuth={onRequiresAuth}
          />
        ))}
        
        {/* Skeleton loaders */}
        {loading && (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="glass-card rounded-xl overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted" />
                    <div className="h-4 w-24 bg-muted rounded" />
                  </div>
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Load More */}
      {hasMore && !loading && (
        <div className="text-center">
          <Button
            onClick={onLoadMore}
            variant="outline"
            size="lg"
          >
            {t('gallery.loadMore')}
          </Button>
        </div>
      )}

      {/* Loading indicator */}
      {loading && artifacts.length > 0 && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        </div>
      )}
    </div>
  );
}
