import { motion } from 'framer-motion';
import { ExternalLink, Activity, AlertTriangle } from 'lucide-react';
import { useTokenStats } from 'lib/hooks/useTokenStats';
import { Skeleton } from '@/components/ui/skeleton';
import { useCopy } from '@/lib/theme/copy';

const DEX_LINK =
  import.meta.env.NEXT_PUBLIC_DEX_LINK ||
  import.meta.env.VITE_DEX_LINK ||
  'https://dexscreener.com';

function formatUsdShort(value: number | null) {
  if (value === null) return '—';
  if (value < 0.01) return `$${value.toFixed(6)}`;
  if (value < 1) return `$${value.toFixed(4)}`;
  if (value < 1000) return `$${value.toFixed(2)}`;
  return `$${Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)}`;
}

function formatCompactNumber(value: number | null) {
  if (value === null) return '—';
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

export function TokenPulseStrip() {
  const t = useCopy();
  const { stats, holders, loading, error } = useTokenStats();
  const isLive = !stats.isStale && !error;
  const hasAnyValue =
    stats.priceUsd !== null ||
    stats.fdvUsd !== null ||
    stats.liquidityUsd !== null ||
    stats.volume24hUsd !== null ||
    holders !== null;

  if (loading && !hasAnyValue) {
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

  if (error && !hasAnyValue) {
    return (
      <div className="glass-card border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
            <AlertTriangle className="w-4 h-4 text-accent" />
            <span className="text-sm">{t('gallery.pulse.error')}</span>
          </div>
        </div>
      </div>
    );
  }

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
              {isLive ? t('gallery.pulse.live') : t('gallery.pulse.stale')}
            </span>
          </div>

          <div className="h-4 w-px bg-border flex-shrink-0" />

          {/* Price */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">{t('gallery.pulse.price')}</span>
            <span className="text-sm font-bold text-foreground">{formatUsdShort(stats.priceUsd)}</span>
          </div>

          <div className="h-4 w-px bg-border flex-shrink-0" />

          {/* FDV/MCAP */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">{t('gallery.pulse.fdv')}</span>
            <span className="text-sm font-semibold">{formatUsdShort(stats.fdvUsd)}</span>
          </div>

          <div className="h-4 w-px bg-border flex-shrink-0 hidden sm:block" />

          {/* Liquidity */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">{t('gallery.pulse.liquidity')}</span>
            <span className="text-sm font-semibold">{formatUsdShort(stats.liquidityUsd)}</span>
          </div>

          <div className="h-4 w-px bg-border flex-shrink-0 hidden md:block" />

          {/* Volume */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">{t('gallery.pulse.volume24h')}</span>
            <span className="text-sm font-semibold">{formatUsdShort(stats.volume24hUsd)}</span>
          </div>

          <div className="h-4 w-px bg-border flex-shrink-0 hidden lg:block" />

          {/* Holders */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">{t('gallery.pulse.holders')}</span>
            <span className="text-sm font-semibold">{formatCompactNumber(holders)}</span>
          </div>

          {/* DEX Link */}
          <a
            href={stats.pairUrl || DEX_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors flex-shrink-0"
          >
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline">{t('gallery.pulse.viewDex')}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
