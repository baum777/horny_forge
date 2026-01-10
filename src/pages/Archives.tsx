import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArchivesNavbar } from '@/components/archives/ArchivesNavbar';
import { FiltersBar } from '@/components/archives/FiltersBar';
import { GalleryGrid } from '@/components/archives/GalleryGrid';
import { ArchivesLoginModal } from '@/components/archives/ArchivesLoginModal';
import { TokenPulseStrip } from '@/components/archives/TokenPulseStrip';
import { useArtifacts } from '@/hooks/useArtifacts';
import Footer from '@/components/layout/Footer';
import type { SortOption } from '@/lib/archives/types';

export default function Archives() {
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const { artifacts, loading, hasMore, loadMore, error } = useArtifacts({
    sort,
    search,
    tag: selectedTag,
  });

  const handleRequiresAuth = useCallback(() => {
    setShowLogin(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ArchivesNavbar />
      
      {/* Token Pulse Strip */}
      <div className="fixed top-16 left-0 right-0 z-30">
        <TokenPulseStrip />
      </div>

      {/* Hero Header */}
      <section className="pt-32 pb-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            <span className="text-gradient">THE HORNY ARCHIVES</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-lg mx-auto"
          >
            A living record of collective desire.
          </motion.p>
        </div>
      </section>

      {/* Filters & Gallery */}
      <section className="pb-20">
        <div className="container mx-auto px-4 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FiltersBar
              sort={sort}
              onSortChange={setSort}
              search={search}
              onSearchChange={setSearch}
              selectedTag={selectedTag}
              onTagChange={setSelectedTag}
            />
          </motion.div>

          {error && (
            <div className="text-center py-8">
              <p className="text-destructive">Not horny enough. Retry.</p>
            </div>
          )}

          <GalleryGrid
            artifacts={artifacts}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onRequiresAuth={handleRequiresAuth}
          />
        </div>
      </section>

      <Footer />

      <ArchivesLoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
