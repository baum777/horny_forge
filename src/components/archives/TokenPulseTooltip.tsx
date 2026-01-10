import { Info, TrendingUp, TrendingDown, AlertTriangle, Activity } from 'lucide-react';
import { useTokenPulse } from '@/context/TokenPulseContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function TokenPulseTooltip() {
  const { stats, loading, error, isLive } = useTokenPulse();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const priceChange = stats?.priceChange24h ?? 0;
  const isPositive = priceChange >= 0;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className="p-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
          aria-label="Token stats"
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
            <span className="font-semibold text-sm">$HORNY Pulse</span>
            <div className={`ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
              isLive ? 'bg-green-500/20 text-green-500' : 'bg-accent/20 text-accent'
            }`}>
              <div className={`w-1 h-1 rounded-full ${isLive ? 'bg-green-500' : 'bg-accent'}`} />
              {isLive ? 'LIVE' : 'STALE'}
            </div>
          </div>

          {loading && !stats ? (
            <div className="text-xs text-muted-foreground">Loading pulse...</div>
          ) : error && !stats ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="w-3 h-3 text-accent" />
              Token pulse unstable.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Price</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{stats?.price || '—'}</span>
                  {priceChange !== 0 && (
                    <span className={isPositive ? 'text-green-500' : 'text-destructive'}>
                      {isPositive ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">{stats?.mcap ? 'MCAP' : 'FDV'}</span>
                <p className="font-semibold">{stats?.mcap || stats?.fdv || '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Liquidity</span>
                <p className="font-semibold">{stats?.liquidity || '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">24h Vol</span>
                <p className="font-semibold">{stats?.volume24h || '—'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Holders</span>
                <p className="font-semibold">{stats?.holders || '—'}</p>
              </div>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
