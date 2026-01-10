import { motion } from 'framer-motion';
import { ExternalLink, Activity, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useTokenPulse } from '@/context/TokenPulseContext';
import { Skeleton } from '@/components/ui/skeleton';

const DEX_LINK = import.meta.env.VITE_DEX_LINK || 'https://dexscreener.com';

export function TokenPulseStrip() {
  const { stats, loading, error, isLive } = useTokenPulse();

  if (loading && !stats) {
    return (
      <div className="glass-card border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 py-2 overflow-x-auto scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-20 flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="glass-card border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
            <AlertTriangle className="w-4 h-4 text-accent" />
            <span className="text-sm">Token pulse unstable.</span>
          </div>
        </div>
      </div>
    );
  }

  const priceChange = stats?.priceChange24h ?? 0;
  const isPositive = priceChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card border-b border-border/50"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 md:gap-6 py-2 overflow-x-auto scrollbar-hide">
          {/* Live/Stale indicator */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-accent'}`} />
            <span className={`text-xs font-medium ${isLive ? 'text-green-500' : 'text-accent'}`}>
              {isLive ? 'LIVE' : 'STALE'}
            </span>
          </div>

          <div className="h-4 w-px bg-border flex-shrink-0" />

          {/* Price */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">Price</span>
            <span className="text-sm font-bold text-foreground">{stats?.price || '—'}</span>
            {priceChange !== 0 && (
              <span className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-500' : 'text-destructive'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {isPositive ? '+' : ''}{priceChange.toFixed(1)}%
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-border flex-shrink-0" />

          {/* FDV/MCAP */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">{stats?.mcap ? 'MCAP' : 'FDV'}</span>
            <span className="text-sm font-semibold">{stats?.mcap || stats?.fdv || '—'}</span>
          </div>

          <div className="h-4 w-px bg-border flex-shrink-0 hidden sm:block" />

          {/* Liquidity */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">Liquidity</span>
            <span className="text-sm font-semibold">{stats?.liquidity || '—'}</span>
          </div>

          <div className="h-4 w-px bg-border flex-shrink-0 hidden md:block" />

          {/* Volume */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">24h Vol</span>
            <span className="text-sm font-semibold">{stats?.volume24h || '—'}</span>
          </div>

          <div className="h-4 w-px bg-border flex-shrink-0 hidden lg:block" />

          {/* Holders */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">Holders</span>
            <span className="text-sm font-semibold">{stats?.holders || '—'}</span>
          </div>

          {/* DEX Link */}
          <a
            href={stats?.pairUrl || DEX_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors flex-shrink-0"
          >
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline">View on DEX</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
