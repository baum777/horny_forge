import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { VoteButton } from './VoteButton';
import { SharePanel } from './SharePanel';
import { TokenPulseTooltip } from './TokenPulseTooltip';
import type { Artifact } from '@/lib/archives/types';

interface ArtifactCardProps {
  artifact: Artifact;
  onRequiresAuth: () => void;
}

export function ArtifactCard({ artifact, onRequiresAuth }: ArtifactCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/archives/${artifact.id}`);
  };

  const timeAgo = formatDistanceToNow(new Date(artifact.created_at), { addSuffix: true });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      onClick={handleClick}
      className="glass-card rounded-xl overflow-hidden cursor-pointer group transition-shadow hover:shadow-[0_0_30px_rgba(236,72,153,0.2)]"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={artifact.image_url}
          alt={artifact.caption}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Tags overlay */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {artifact.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-primary backdrop-blur-sm shadow-[0_0_8px_rgba(236,72,153,0.3)]"
            >
              {tag}
            </span>
          ))}
          {artifact.tags.length > 2 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-muted-foreground backdrop-blur-sm">
              +{artifact.tags.length - 2}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Author */}
        <div className="flex items-center gap-2">
          {artifact.author_avatar ? (
            <img
              src={artifact.author_avatar}
              alt={artifact.author_handle || 'Author'}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-destructive" />
          )}
          <span className="text-sm font-medium truncate">
            {artifact.author_handle || 'Anonymous'}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {timeAgo}
          </span>
        </div>

        {/* Caption */}
        <p className="text-sm line-clamp-2">{artifact.caption}</p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <VoteButton
            artifactId={artifact.id}
            initialVotesCount={artifact.votes_count}
            onRequiresAuth={onRequiresAuth}
            size="sm"
          />
          <div className="flex items-center gap-1">
            <TokenPulseTooltip />
            <SharePanel
              artifactId={artifact.id}
              caption={artifact.caption}
              compact
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
