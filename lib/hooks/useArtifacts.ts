"use client";

import { useCallback, useEffect, useState } from "react";
import type { Artifact, SortOption } from "@/lib/archives/types";
import { supabase } from "@/lib/supabase/client";

interface UseArtifactsOptions {
  sort?: SortOption;
  tag?: string | null;
  search?: string;
  authorId?: string;
  limit?: number;
}

export function useArtifacts(options: UseArtifactsOptions = {}) {
  const { sort = "newest", tag = null, search = "", authorId, limit = 20 } = options;

  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      setLoading(true);
      setError(null);

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

      const from = pageNum * limit;
      const to = from + limit - 1;
      const { data, error: fetchError } = await query.range(from, to);

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setArtifacts((prev) => (append ? [...prev, ...(data ?? [])] : (data ?? [])));
      setHasMore((data ?? []).length === limit);
      setPage(pageNum);
      setLoading(false);
    },
    [sort, tag, search, authorId, limit]
  );

  useEffect(() => {
    fetchPage(0, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchPage(page + 1, true);
  }, [loading, hasMore, page, fetchPage]);

  const refetch = useCallback(() => {
    fetchPage(0, false);
  }, [fetchPage]);

  return { artifacts, loading, error, hasMore, loadMore, refetch };
}

export function useArtifact(id: string | undefined) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("artifacts")
        .select("*")
        .eq("id", id)
        .single();

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setArtifact(null);
      } else {
        setArtifact(data as Artifact);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { artifact, loading, error };
}
