import { useState, useEffect, useCallback, createContext, useContext, createElement } from 'react';
import type { ReactNode } from 'react';
import { fetchTokenStats } from '@/lib/tokenData/dexscreener';
import { fetchHolders } from '@/lib/tokenData/holders';
import type { TokenStats } from '@/lib/tokenData/types';

interface TokenStatsContextValue {
  stats: TokenStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const TokenStatsContext = createContext<TokenStatsContextValue | null>(null);

const POLL_INTERVAL = 45000;

interface TokenStatsProviderProps {
  children: ReactNode;
}

export function TokenStatsProvider({ children }: TokenStatsProviderProps) {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [tokenStats, holders] = await Promise.all([
        fetchTokenStats(),
        fetchHolders(),
      ]);
      
      setStats({
        ...tokenStats,
        holders,
      });
      setError(tokenStats.isStale ? 'Token pulse unstable.' : null);
    } catch (err) {
      console.error('Token stats error:', err);
      setError('Token pulse unstable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  const value: TokenStatsContextValue = { stats, loading, error, refresh };

  return createElement(TokenStatsContext.Provider, { value }, children);
}

export function useTokenStats(): TokenStatsContextValue {
  const context = useContext(TokenStatsContext);
  
  if (!context) {
    return {
      stats: null,
      loading: true,
      error: null,
      refresh: async () => {},
    };
  }
  
  return context;
}