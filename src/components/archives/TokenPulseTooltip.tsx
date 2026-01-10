// Token Pulse Tooltip - Info icon with token stats tooltip for ArtifactCard

import { Info, TrendingUp, Activity, Droplets, BarChart3, ExternalLink } from 'lucide-react';
import { useTokenStats } from '@/hooks/useTokenStats';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

const DEX_LINK = 'https://dexscreener.com/solana/earthgewsskrbg6cmvx9ddxntniac4shmsthr5nnxwji';

interface StatLineProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  loading?: boolean;
}

function StatLine({ icon, label, value, loading }: StatLineProps) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-3 w-10" />
      ) : (
        <span className="font-medium text-foreground">{value ?? '—'}</span>
      )}
    </div>
  );
}

export function TokenPulseTooltip() {
  const { stats, loading, error } = useTokenStats();
  
  const isLive = stats && !stats.isStale;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="p-1 text-muted-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          className="w-52 p-3 bg-card border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
              $HORNY Pulse
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLive ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <span className="text-[9px] text-muted-foreground uppercase">
                {isLive ? 'LIVE' : 'STALE'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-1.5">
            <StatLine
              icon={<TrendingUp className="w-3 h-3" />}
              label="Price"
              value={stats?.priceUsd}
              loading={loading}
            />
            <StatLine
              icon={<Activity className="w-3 h-3" />}
              label="FDV"
              value={stats?.fdvUsd}
              loading={loading}
            />
            <StatLine
              icon={<Droplets className="w-3 h-3" />}
              label="Liquidity"
              value={stats?.liquidityUsd}
              loading={loading}
            />
            <StatLine
              icon={<BarChart3 className="w-3 h-3" />}
              label="24h Vol"
              value={stats?.volume24hUsd}
              loading={loading}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[9px] text-yellow-500 mt-2">{error}</p>
          )}

          {/* Link */}
          <a
            href={stats?.pairUrl || DEX_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1 mt-3 pt-2 border-t border-border/50 text-[10px] text-primary hover:text-primary/80 transition-colors"
          >
            View on DEX
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
