import { useCallback, useEffect, useState } from "react";
import type { Artifact, SortOption } from "@/lib/archives/types";
import { fetchArtifactById, fetchArtifacts, fetchUserStatsByIds, fetchUserTopBadgesByIds } from "lib/supabase/queries";

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

      const { data, error: fetchError } = await fetchArtifacts({
        sort,
        tag,
        search,
        authorId,
        limit,
        page: pageNum,
      });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const authorIds = Array.from(new Set(data.map((artifact) => artifact.author_id).filter(Boolean)));
      const [statsResult, badgesResult] = await Promise.all([
        fetchUserStatsByIds(authorIds),
        fetchUserTopBadgesByIds(authorIds),
      ]);

      const levelMap = new Map<string, number>();
      (statsResult.data ?? []).forEach((entry) => {
        levelMap.set(entry.user_id, entry.level ?? 1);
      });

      const badgeMap = new Map<string, string>();
      (badgesResult.data ?? []).forEach((entry) => {
        if (!badgeMap.has(entry.user_id)) {
          badgeMap.set(entry.user_id, entry.badge_id);
        }
      });

      const enriched = data.map((artifact) => ({
        ...artifact,
        author_level: levelMap.get(artifact.author_id) ?? 1,
        author_top_badge_id: badgeMap.get(artifact.author_id) ?? null,
      }));

      setArtifacts((prev) => (append ? [...prev, ...enriched] : enriched));
      setHasMore(data.length === limit);
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
      const { data, error: fetchError } = await fetchArtifactById(id);
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setArtifact(null);
      } else {
        setArtifact(data);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { artifact, loading, error };
}
