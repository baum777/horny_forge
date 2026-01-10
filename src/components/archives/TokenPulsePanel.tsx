import { motion } from 'framer-motion';
import { RefreshCw, ExternalLink, Activity, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTokenPulse } from '@/context/TokenPulseContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const DEX_LINK = import.meta.env.VITE_DEX_LINK || 'https://dexscreener.com';

export function TokenPulsePanel() {
  const { stats, loading, error, isLive, lastUpdated, refresh } = useTokenPulse();

  if (loading && !stats) {
    return (
      <div className="glass-card p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    );
  }

  const priceChange = stats?.priceChange24h ?? 0;
  const isPositive = priceChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 rounded-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h4 className="font-semibold">Token Pulse</h4>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            isLive 
              ? 'bg-green-500/20 text-green-500' 
              : 'bg-accent/20 text-accent'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-accent'}`} />
            {isLive ? 'LIVE' : 'STALE'}
          </div>
        </div>
        <Button
          onClick={refresh}
          variant="ghost"
          size="sm"
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && !stats ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <AlertTriangle className="w-4 h-4 text-accent" />
          <span className="text-sm">Token pulse unstable.</span>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatItem 
              label="Price" 
              value={stats?.price || '—'} 
              badge={
                priceChange !== 0 && (
                  <span className={`flex items-center text-xs ${isPositive ? 'text-green-500' : 'text-destructive'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{priceChange.toFixed(1)}%
                  </span>
                )
              }
            />
            <StatItem label={stats?.mcap ? 'MCAP' : 'FDV'} value={stats?.mcap || stats?.fdv || '—'} />
            <StatItem label="Liquidity" value={stats?.liquidity || '—'} />
            <StatItem label="24h Volume" value={stats?.volume24h || '—'} />
            <StatItem label="Holders" value={stats?.holders || '—'} />
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mb-3">
              Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </p>
          )}

          {/* DEX Link */}
          <a
            href={stats?.pairUrl || DEX_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <Activity className="w-4 h-4" />
            View on DEX
            <ExternalLink className="w-3 h-3" />
          </a>
        </>
      )}
    </motion.div>
  );
}

function StatItem({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center gap-2">
        <span className="font-semibold">{value}</span>
        {badge}
      </div>
    </div>
  );
}
