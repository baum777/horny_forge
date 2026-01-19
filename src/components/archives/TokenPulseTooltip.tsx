import { Info, AlertTriangle, Activity } from 'lucide-react';
import { useTokenStats } from 'lib/hooks/useTokenStats';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCopy } from '@/lib/theme/copy';

function formatUsd(value: number | null) {
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

export function TokenPulseTooltip() {
  const t = useCopy();
  const { stats, holders, loading, error } = useTokenStats();
  const isLive = !stats.isStale && !error;
  const hasAnyValue =
    stats.priceUsd !== null ||
    stats.fdvUsd !== null ||
    stats.liquidityUsd !== null ||
    stats.volume24hUsd !== null ||
    holders !== null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className="p-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
          aria-label={t('gallery.pulse.ariaLabel')}
        >
          <Info className="w-3 h-3 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        align="end"
        className="w-64 p-3 glass-card border-border"
        onClick={handleClick}
      >
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Activity className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">{t('gallery.pulse.title')}</span>
            <div className={`ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
              isLive ? 'bg-green-500/20 text-green-500' : 'bg-accent/20 text-accent'
            }`}>
              <div className={`w-1 h-1 rounded-full ${isLive ? 'bg-green-500' : 'bg-accent'}`} />
              {isLive ? t('gallery.pulse.live') : t('gallery.pulse.stale')}
            </div>
          </div>

          {loading && !hasAnyValue ? (
            <div className="text-xs text-muted-foreground">{t('gallery.pulse.loading')}</div>
          ) : error && !hasAnyValue ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="w-3 h-3 text-accent" />
              {t('gallery.pulse.error')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">{t('gallery.pulse.price')}</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{formatUsd(stats.priceUsd)}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">{t('gallery.pulse.fdv')}</span>
                <p className="font-semibold">{formatUsd(stats.fdvUsd)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('gallery.pulse.liquidity')}</span>
                <p className="font-semibold">{formatUsd(stats.liquidityUsd)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('gallery.pulse.volume24h')}</span>
                <p className="font-semibold">{formatUsd(stats.volume24hUsd)}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">{t('gallery.pulse.holders')}</span>
                <p className="font-semibold">{formatCompactNumber(holders)}</p>
              </div>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
