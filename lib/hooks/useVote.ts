import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "lib/hooks/useAuth";
import { hasUserVoted, rpcUnvote, rpcVote, type VoteRpcResponse } from "lib/supabase/queries";
import { postGamificationEvent } from "@/lib/api/event";

interface UseVoteOptions {
  artifactId: string;
  initialVotesCount: number;
}

function isVoteRpcResponse(value: unknown): value is VoteRpcResponse {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.success === "boolean" &&
    typeof v.votes_count === "number" &&
    (typeof v.error === "string" || v.error === null) &&
    (typeof v.vote_id === "string" || v.vote_id === null || typeof v.vote_id === "undefined")
  );
}

export function useVote({ artifactId, initialVotesCount }: UseVoteOptions) {
  const { user, isAuthenticated } = useAuth();
  const [hasVoted, setHasVoted] = useState(false);
  const [votesCount, setVotesCount] = useState(initialVotesCount);
  const [loading, setLoading] = useState(false);
  const [checkingVote, setCheckingVote] = useState(true);

  useEffect(() => {
    setVotesCount(initialVotesCount);
  }, [initialVotesCount]);

  useEffect(() => {
    if (!user || !artifactId) {
      setHasVoted(false);
      setCheckingVote(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setCheckingVote(true);
      const { hasVoted: voted, error } = await hasUserVoted({
        artifactId,
        userId: user.id,
      });
      if (cancelled) return;
      if (!error) setHasVoted(voted);
      setCheckingVote(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, artifactId]);

  const toggleVote = useCallback(async () => {
    if (!isAuthenticated || !user) return { requiresAuth: true };
    if (loading) return { requiresAuth: false };

    setLoading(true);

    // optimistic update
    const wasVoted = hasVoted;
    setHasVoted(!wasVoted);
    setVotesCount((prev) => (wasVoted ? prev - 1 : prev + 1));

    try {
      const rpc = wasVoted ? await rpcUnvote(artifactId) : await rpcVote(artifactId);
      if (rpc.error) throw rpc.error;
      if (!isVoteRpcResponse(rpc.data)) throw new Error("Invalid vote RPC response");
      if (!rpc.data.success) throw new Error(rpc.data.error ?? "Vote RPC failed");

      setVotesCount(rpc.data.votes_count);
      if (!wasVoted) {
        toast.success("Desire registered.");
        const eventId = crypto.randomUUID();
        void postGamificationEvent({
          event_id: eventId,
          type: "vote_cast",
          subject_id: artifactId,
        });
        if (rpc.data.vote_id) {
          void postGamificationEvent({
            event_id: crypto.randomUUID(),
            type: "vote_received",
            subject_id: artifactId,
            proof: { vote_id: rpc.data.vote_id },
          });
        }
      }
    } catch (err) {
      // revert optimistic state
      setHasVoted(wasVoted);
      setVotesCount((prev) => (wasVoted ? prev + 1 : prev - 1));
      toast.error("Not horny enough. Retry.");
      console.error("Vote error:", err);
    } finally {
      setLoading(false);
    }

    return { requiresAuth: false };
  }, [isAuthenticated, user, loading, hasVoted, artifactId]);

  return { hasVoted, votesCount, toggleVote, loading, checkingVote };
}
