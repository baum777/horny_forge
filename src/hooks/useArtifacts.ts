import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Artifact, SortOption } from '@/lib/archives/types';

interface UseArtifactsOptions {
  sort?: SortOption;
  tag?: string | null;
  search?: string;
  authorId?: string;
  limit?: number;
}

export function useArtifacts(options: UseArtifactsOptions = {}) {
  const { sort = 'newest', tag = null, search = '', authorId, limit = 20 } = options;
  
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchArtifacts = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('artifacts')
        .select('*');

      // Apply filters
      if (authorId) {
        query = query.eq('author_id', authorId);
      }

      if (tag) {
        query = query.contains('tags', [tag]);
      }

      if (search) {
        query = query.or(`caption.ilike.%${search}%,author_handle.ilike.%${search}%`);
      }

      // Apply sorting
      if (sort === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sort === 'top24h') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        query = query
          .gte('created_at', yesterday.toISOString())
          .order('votes_count', { ascending: false });
      } else if (sort === 'topAll') {
        query = query.order('votes_count', { ascending: false });
      }

      // Pagination
      const from = pageNum * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const typedData = (data || []) as Artifact[];
      
      if (append) {
        setArtifacts(prev => [...prev, ...typedData]);
      } else {
        setArtifacts(typedData);
      }
      
      setHasMore(typedData.length === limit);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch artifacts');
    } finally {
      setLoading(false);
    }
  }, [sort, tag, search, authorId, limit]);

  useEffect(() => {
    fetchArtifacts(0, false);
  }, [fetchArtifacts]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchArtifacts(page + 1, true);
    }
  }, [loading, hasMore, page, fetchArtifacts]);

  const refetch = useCallback(() => {
    fetchArtifacts(0, false);
  }, [fetchArtifacts]);

  return {
    artifacts,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
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

    const fetchArtifact = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('artifacts')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        setArtifact(data as Artifact);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Artifact not found');
      } finally {
        setLoading(false);
      }
    };

    fetchArtifact();
  }, [id]);

  return { artifact, loading, error };
}
