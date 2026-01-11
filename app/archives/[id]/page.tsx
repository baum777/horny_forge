"use client";

import { use } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import NavBar from '@/components/nav/NavBar';
import { TokenPulsePanel } from '@/components/token/TokenPulsePanel';
import { VoteButton } from '@/components/archives/VoteButton';
import { SharePanel } from '@/components/archives/SharePanel';
import { useArtifact } from '@/lib/hooks/useArtifacts';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoginModal } from '@/components/auth/LoginModal';
import { useState, useCallback } from 'react';

export default function ArtifactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { artifact, loading, error } = useArtifact(id);
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const handleRequiresAuth = useCallback(() => {
    setShowLogin(true);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !artifact) {
    notFound();
  }

  const handleRequiresAuth = useCallback(() => {
    setShowLogin(true);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-background">
        <NavBar />
        
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image */}
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="relative aspect-square w-full">
                  <Image
                    src={artifact.image_url}
                    alt={artifact.caption}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              {/* Caption & Tags */}
              <div className="glass-card p-6 space-y-4">
                <h1 className="text-2xl font-bold">{artifact.caption}</h1>
                <div className="flex flex-wrap gap-2">
                  {artifact.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Author Block */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-4">
                  {artifact.author_avatar ? (
                    <Image
                      src={artifact.author_avatar}
                      alt={artifact.author_handle || 'Author'}
                      width={48}
                      height={48}
                      className="rounded-full object-cover ring-2 ring-border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-destructive" />
                  )}
                  <div>
                    <p className="font-semibold">{artifact.author_handle || 'Anonymous'}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(artifact.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Vote & Share */}
              <div className="glass-card p-6 space-y-4">
                <VoteButton
                  artifactId={artifact.id}
                  initialVotesCount={artifact.votes_count}
                  onRequiresAuth={handleRequiresAuth}
                />
                <SharePanel
                  artifactId={artifact.id}
                  caption={artifact.caption}
                />
              </div>

              {/* Token Pulse */}
              <TokenPulsePanel />
            </div>
          </div>
        </div>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}

