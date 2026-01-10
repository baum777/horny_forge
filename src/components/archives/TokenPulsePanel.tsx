// Token Pulse Panel - Detailed token stats for artifact detail page

import { motion } from 'framer-motion';
import { Activity, ExternalLink, TrendingUp, Droplets, BarChart3, Users, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTokenStats } from '@/hooks/useTokenStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const DEX_LINK = 'https://dexscreener.com/solana/earthgewsskrbg6cmvx9ddxntniac4shmsthr5nnxwji';

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  loading?: boolean;
}

function StatRow({ icon, label, value, loading }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-5 w-16" />
      ) : (
        <span className="text-sm font-semibold text-foreground">
          {value ?? '—'}
        </span>
      )}
    </div>
  );
}

export function TokenPulsePanel() {
  const { stats, loading, error, refresh } = useTokenStats();
  
  const isLive = stats && !stats.isStale;
  const lastUpdated = stats?.updatedAt 
    ? formatDistanceToNow(stats.updatedAt, { addSuffix: true })
    : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 rounded-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-wide">Token Pulse</h3>
          <span
            className={`w-2 h-2 rounded-full ${
              isLive 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-yellow-500'
            }`}
          />
        </div>
        <button
          onClick={refresh}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error state */}
      {error && (
        <p className="text-xs text-yellow-500 mb-3">{error}</p>
      )}

      {/* Stats */}
      <div className="space-y-1 divide-y divide-border/50">
        <StatRow
          icon={<TrendingUp className="w-4 h-4" />}
          label="Price"
          value={stats?.priceUsd}
          loading={loading}
        />
        <StatRow
          icon={<Activity className="w-4 h-4" />}
          label="FDV / MCAP"
          value={stats?.fdvUsd}
          loading={loading}
        />
        <StatRow
          icon={<Droplets className="w-4 h-4" />}
          label="Liquidity"
          value={stats?.liquidityUsd}
          loading={loading}
        />
        <StatRow
          icon={<BarChart3 className="w-4 h-4" />}
          label="24h Volume"
          value={stats?.volume24hUsd}
          loading={loading}
        />
        <StatRow
          icon={<Users className="w-4 h-4" />}
          label="Holders"
          value={stats?.holders?.toLocaleString() ?? null}
          loading={loading}
        />
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
        {lastUpdated && (
          <span className="text-[10px] text-muted-foreground">
            Updated {lastUpdated}
          </span>
        )}
        <Button
          variant="link"
          size="sm"
          className="text-primary p-0 h-auto"
          asChild
        >
          <a
            href={stats?.pairUrl || DEX_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1"
          >
            View on DEX
            <ExternalLink className="w-3 h-3" />
          </a>
        </Button>
      </div>
    </motion.div>
  );
}
