"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useXPEvent } from "@/lib/hooks/useXPEvent";
import { supabase } from "@/lib/supabase/client";

interface UseVoteOptions {
  artifactId: string;
  initialVotesCount: number;
}

type VoteRpcResponse = {
  success: boolean;
  votes_count: number;
  error: string | null;
};

function isVoteRpcResponse(value: unknown): value is VoteRpcResponse {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.success === "boolean" &&
    typeof v.votes_count === "number" &&
    (typeof v.error === "string" || v.error === null)
  );
}

export function useVote({ artifactId, initialVotesCount }: UseVoteOptions) {
  const { user, isAuthenticated } = useAuth();
  const { triggerEvent } = useXPEvent();
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
      const { data, error } = await supabase
        .from("votes")
        .select("artifact_id")
        .eq("artifact_id", artifactId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (!error) setHasVoted(!!data);
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

    const wasVoted = hasVoted;
    setHasVoted(!wasVoted);
    setVotesCount((prev) => (wasVoted ? prev - 1 : prev + 1));

    try {
      const rpc = wasVoted 
        ? await supabase.rpc("rpc_unvote", { p_artifact_id: artifactId })
        : await supabase.rpc("rpc_vote", { p_artifact_id: artifactId });

      if (rpc.error) throw rpc.error;
      if (!isVoteRpcResponse(rpc.data)) throw new Error("Invalid vote RPC response");
      if (!rpc.data.success) throw new Error(rpc.data.error ?? "Vote RPC failed");

      setVotesCount(rpc.data.votes_count);
      if (!wasVoted) {
        toast.success("Desire registered.");
        // Trigger XP event for vote_cast
        triggerEvent("vote_cast", { artifactId }).catch((err) => {
          console.error("Failed to trigger vote_cast XP event:", err);
        });
        
        // Trigger vote_received event for artifact author
        // Fetch artifact to get author_id
        const { data: artifact } = await supabase
          .from("artifacts")
          .select("author_id")
          .eq("id", artifactId)
          .single();
        
        if (artifact && artifact.author_id !== user.id) {
          // Trigger vote_received event (this will be handled server-side)
          // For MVP, we'll call the event API with the artifact author context
          // Note: This requires the author to be authenticated, which may not always be true
          // In production, you'd want to handle this server-side via a database trigger
          fetch("/api/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "vote_received",
              artifact_id: artifactId,
              meta: { author_id: artifact.author_id },
            }),
          }).catch((err) => {
            console.error("Failed to trigger vote_received XP event:", err);
          });
        }
      }
    } catch (err) {
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
