import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface TokenStats {
  price: string | null;
  priceChange24h: number | null;
  fdv: string | null;
  mcap: string | null;
  liquidity: string | null;
  volume24h: string | null;
  holders: string | null;
  pairUrl: string | null;
}

interface TokenPulseContextType {
  stats: TokenStats | null;
  loading: boolean;
  error: boolean;
  isLive: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
}

const TokenPulseContext = createContext<TokenPulseContextType | undefined>(undefined);

// Mock data for now - can be replaced with real DEX API later
const MOCK_STATS: TokenStats = {
  price: '$0.00042069',
  priceChange24h: 12.5,
  fdv: '$4.2M',
  mcap: '$2.1M',
  liquidity: '$420K',
  volume24h: '$69K',
  holders: '1,337',
  pairUrl: null,
};

const REFRESH_INTERVAL = 30000; // 30 seconds
const STALE_THRESHOLD = 60000; // 1 minute

export function TokenPulseProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      // Simulate API call - replace with real DEX API integration
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Using mock data for now
      setStats(MOCK_STATS);
      setLastUpdated(new Date());
      setError(false);
      setIsLive(true);
    } catch (err) {
      console.error('Failed to fetch token stats:', err);
      setError(true);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]);

  // Initial fetch and polling
  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(() => {
      fetchStats();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchStats]);

  // Check for stale data
  useEffect(() => {
    const checkStale = () => {
      if (lastUpdated) {
        const isStale = Date.now() - lastUpdated.getTime() > STALE_THRESHOLD;
        setIsLive(!isStale && !error);
      }
    };

    const interval = setInterval(checkStale, 5000);
    return () => clearInterval(interval);
  }, [lastUpdated, error]);

  return (
    <TokenPulseContext.Provider value={{ stats, loading, error, isLive, lastUpdated, refresh }}>
      {children}
    </TokenPulseContext.Provider>
  );
}

export function useTokenPulse() {
  const context = useContext(TokenPulseContext);
  if (context === undefined) {
    throw new Error('useTokenPulse must be used within a TokenPulseProvider');
  }
  return context;
}
