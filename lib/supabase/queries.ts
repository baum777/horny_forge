import { supabase } from "./client";
import type { Artifact, SortOption } from "@/lib/archives/types";
import type { BadgeId } from "lib/gamification/badgeRules";

export type VoteRpcResponse = {
  success: boolean;
  votes_count: number;
  vote_id?: string | null;
  error: string | null;
};

export type FetchArtifactsParams = {
  sort?: SortOption;
  tag?: string | null;
  search?: string;
  authorId?: string;
  limit?: number;
  page?: number;
};

export async function fetchArtifacts({
  sort = "newest",
  tag = null,
  search = "",
  authorId,
  limit = 20,
  page = 0,
}: FetchArtifactsParams) {
  let query = supabase.from("artifacts").select("*");

  if (authorId) query = query.eq("author_id", authorId);
  if (tag) query = query.contains("tags", [tag]);
  if (search) {
    query = query.or(`caption.ilike.%${search}%,author_handle.ilike.%${search}%`);
  }

  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "top24h") {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);
    query = query.gte("created_at", cutoff.toISOString()).order("votes_count", {
      ascending: false,
    });
  } else if (sort === "topAll") {
    query = query.order("votes_count", { ascending: false });
  }

  const from = page * limit;
  const to = from + limit - 1;
  const { data, error } = await query.range(from, to);

  return { data: (data ?? []) as Artifact[], error };
}

export async function fetchArtifactById(id: string) {
  const { data, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("id", id)
    .single();

  return { data: (data as Artifact) ?? null, error };
}

export async function fetchMoreFromAuthor(params: {
  authorId: string;
  excludeId?: string;
  limit?: number;
}) {
  const { authorId, excludeId, limit = 4 } = params;
  let query = supabase
    .from("artifacts")
    .select("*")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  return { data: (data ?? []) as Artifact[], error };
}

export async function fetchUserStatsByIds(userIds: string[]) {
  if (userIds.length === 0) return { data: [], error: null };
  const { data, error } = await supabase
    .from("user_stats")
    .select("user_id, level")
    .in("user_id", userIds);

  return { data: (data ?? []) as { user_id: string; level: number }[], error };
}

export async function fetchUserTopBadgesByIds(userIds: string[]) {
  if (userIds.length === 0) return { data: [], error: null };
  const { data, error } = await supabase
    .from("user_badges")
    .select("user_id, badge_id, unlocked_at")
    .in("user_id", userIds)
    .order("unlocked_at", { ascending: false });

  return {
    data: (data ?? []) as { user_id: string; badge_id: BadgeId; unlocked_at: string }[],
    error,
  };
}

export async function hasUserVoted(params: { artifactId: string; userId: string }) {
  const { artifactId, userId } = params;
  const { data, error } = await supabase
    .from("votes")
    .select("artifact_id")
    .eq("artifact_id", artifactId)
    .eq("user_id", userId)
    .maybeSingle();

  return { hasVoted: !!data, error };
}

export async function rpcVote(artifactId: string) {
  const { data, error } = await supabase.rpc("rpc_vote", {
    p_artifact_id: artifactId,
  });

  return { data: (data as unknown as VoteRpcResponse) ?? null, error };
}

export async function rpcUnvote(artifactId: string) {
  const { data, error } = await supabase.rpc("rpc_unvote", {
    p_artifact_id: artifactId,
  });

  return { data: (data as unknown as VoteRpcResponse) ?? null, error };
}

export async function uploadArtifactImage(params: { userId: string; file: File }) {
  const { userId, file } = params;
  const objectName = `artifacts/${userId}/${crypto.randomUUID()}`;

  const { error: uploadError } = await supabase.storage
    .from("artifacts")
    .upload(objectName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { data: null as null, error: uploadError };

  const { data } = supabase.storage.from("artifacts").getPublicUrl(objectName);
  return { data: { objectName, publicUrl: data.publicUrl }, error: null };
}
