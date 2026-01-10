import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UseVoteOptions {
  artifactId: string;
  initialVotesCount: number;
}

interface RpcResult {
  success: boolean;
  error?: string;
  votes_count?: number;
}

export function useVote({ artifactId, initialVotesCount }: UseVoteOptions) {
  const { user, isAuthenticated } = useAuth();
  const [hasVoted, setHasVoted] = useState(false);
  const [votesCount, setVotesCount] = useState(initialVotesCount);
  const [loading, setLoading] = useState(false);
  const [checkingVote, setCheckingVote] = useState(true);

  // Check if user has already voted
  useEffect(() => {
    if (!user || !artifactId) {
      setCheckingVote(false);
      return;
    }

    const checkVote = async () => {
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('artifact_id')
          .eq('artifact_id', artifactId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setHasVoted(!!data);
      } catch (err) {
        console.error('Error checking vote:', err);
      } finally {
        setCheckingVote(false);
      }
    };

    checkVote();
  }, [user, artifactId]);

  // Update votes count when prop changes
  useEffect(() => {
    setVotesCount(initialVotesCount);
  }, [initialVotesCount]);

  const toggleVote = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return { requiresAuth: true };
    }

    if (loading) return { requiresAuth: false };

    setLoading(true);

    // Optimistic update
    const wasVoted = hasVoted;
    setHasVoted(!wasVoted);
    setVotesCount(prev => wasVoted ? prev - 1 : prev + 1);

    try {
      // Use RPC functions for atomic vote operations
      const rpcName = wasVoted ? 'rpc_unvote' : 'rpc_vote';
      const { data, error } = await supabase.rpc(rpcName, {
        p_artifact_id: artifactId,
      });

      if (error) throw error;

      const result = data as unknown as RpcResult;
      
      if (!result.success) {
        throw new Error(result.error || 'Vote operation failed');
      }

      // Update with actual count from DB
      if (typeof result.votes_count === 'number') {
        setVotesCount(result.votes_count);
      }

      if (!wasVoted) {
        toast.success('Desire registered.');
      }
    } catch (err) {
      // Revert on error
      setHasVoted(wasVoted);
      setVotesCount(prev => wasVoted ? prev + 1 : prev - 1);
      toast.error('Not horny enough. Retry.');
      console.error('Vote error:', err);
    } finally {
      setLoading(false);
    }

    return { requiresAuth: false };
  }, [isAuthenticated, user, loading, hasVoted, artifactId]);

  return {
    hasVoted,
    votesCount,
    toggleVote,
    loading,
    checkingVote,
  };
}