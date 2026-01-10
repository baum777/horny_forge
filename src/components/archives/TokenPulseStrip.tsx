// Token Pulse Strip - Top bar showing live token stats

import { motion } from 'framer-motion';
import { Activity, ExternalLink, TrendingUp, Droplets, BarChart3, Users } from 'lucide-react';
import { useTokenStats } from '@/hooks/useTokenStats';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const DEX_LINK = 'https://dexscreener.com/solana/earthgewsskrbg6cmvx9ddxntniac4shmsthr5nnxwji';

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  loading?: boolean;
}

function StatItem({ icon, label, value, loading }: StatItemProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1">
      <span className="text-primary">{icon}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide hidden sm:inline">
        {label}
      </span>
      {loading ? (
        <Skeleton className="h-4 w-12" />
      ) : (
        <span className="text-sm font-semibold text-foreground">
          {value ?? '—'}
        </span>
      )}
    </div>
  );
}

export function TokenPulseStrip() {
  const { stats, loading, error } = useTokenStats();
  
  const isLive = stats && !stats.isStale;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/80 backdrop-blur-md border-b border-border"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2 overflow-x-auto scrollbar-hide">
          {/* Left: Token Pulse label + live indicator */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              $HORNY
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isLive 
                          ? 'bg-green-500 animate-pulse' 
                          : 'bg-yellow-500'
                      }`}
                    />
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {isLive ? 'LIVE' : 'STALE'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {error || (isLive ? 'Data is live' : 'Using cached data')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Center: Stats */}
          <div className="flex items-center gap-1 mx-4">
            <StatItem
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              label="Price"
              value={stats?.priceUsd}
              loading={loading}
            />
            <div className="w-px h-4 bg-border" />
            <StatItem
              icon={<Activity className="w-3.5 h-3.5" />}
              label="FDV"
              value={stats?.fdvUsd}
              loading={loading}
            />
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="hidden sm:flex">
              <StatItem
                icon={<Droplets className="w-3.5 h-3.5" />}
                label="Liq"
                value={stats?.liquidityUsd}
                loading={loading}
              />
            </div>
            <div className="w-px h-4 bg-border hidden md:block" />
            <div className="hidden md:flex">
              <StatItem
                icon={<BarChart3 className="w-3.5 h-3.5" />}
                label="24h Vol"
                value={stats?.volume24hUsd}
                loading={loading}
              />
            </div>
            <div className="w-px h-4 bg-border hidden lg:block" />
            <div className="hidden lg:flex">
              <StatItem
                icon={<Users className="w-3.5 h-3.5" />}
                label="Holders"
                value={stats?.holders?.toLocaleString() ?? null}
                loading={loading}
              />
            </div>
          </div>

          {/* Right: View on DEX link */}
          <a
            href={stats?.pairUrl || DEX_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            <span className="hidden sm:inline">View on DEX</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
