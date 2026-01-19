import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useVote } from '@/hooks/useVote';
import { cn } from '@/lib/utils';
import { useCopy } from '@/lib/theme/copy';

interface VoteButtonProps {
  artifactId: string;
  initialVotesCount: number;
  onRequiresAuth: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function VoteButton({ 
  artifactId, 
  initialVotesCount, 
  onRequiresAuth,
  size = 'md' 
}: VoteButtonProps) {
  const t = useCopy();
  const { hasVoted, votesCount, toggleVote, loading } = useVote({
    artifactId,
    initialVotesCount,
  });

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const result = await toggleVote();
    if (result?.requiresAuth) {
      onRequiresAuth();
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={loading}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'flex items-center rounded-full font-medium transition-all',
        sizeClasses[size],
        hasVoted
          ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(236,72,153,0.5)]'
          : 'bg-muted/50 text-muted-foreground hover:bg-primary/20 hover:text-primary'
      )}
    >
      <motion.div
        animate={hasVoted ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart 
          className={cn(
            iconSizes[size],
            hasVoted && 'fill-current'
          )} 
        />
      </motion.div>
      <span className="font-bold">{votesCount}</span>
      <span className="hidden sm:inline">{t('votes.label')}</span>
    </motion.button>
  );
}
