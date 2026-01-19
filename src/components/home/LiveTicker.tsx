import { useTokenStats } from "lib/hooks/useTokenStats";
import { ExternalLink, TrendingUp, Users, Droplets, Activity } from "lucide-react";
import { useCopy } from "@/lib/theme/copy";

export function LiveTicker() {
  const t = useCopy();
  const { stats, holders, loading } = useTokenStats();

  // Formatierungs-Helper
  const formatUsd = (val: number | null) => {
    if (val === null) return "—";
    return val < 0.01 
      ? `$${val.toFixed(6)}` 
      : `$${val.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };
  
  const formatCompact = (val: number | null) => {
    if (val === null) return "—";
    return `$${Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(val)}`;
  };

  const formatPercent = (val: number | null) => {
    if (val === null) return "—";
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(2)}%`;
  };

  // Ein Segment des Tickers (wird wiederholt)
  const TickerSegment = () => (
    <div className="flex items-center gap-8 px-4 text-sm md:text-base">
       {/* Price */}
       <div className="flex items-center gap-2">
        <span className="font-black text-primary">{t('ticker.tokenSymbol')}</span>
         <span className="font-mono font-bold">{formatUsd(stats.priceUsd)}</span>
       </div>
       
       {/* 24h Change */}
       <div className={`flex items-center gap-1.5 font-bold ${
         (stats.priceChange24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'
       }`}>
         <TrendingUp className="w-4 h-4" />
        <span>{t('ticker.change24h', { value: formatPercent(stats.priceChange24h) })}</span>
       </div>

       <span className="text-muted-foreground/30 mx-2">|</span>

       {/* Market Cap */}
       <div className="flex items-center gap-2">
        <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">{t('ticker.marketCap')}</span>
         <span className="font-mono font-bold text-foreground">{formatCompact(stats.fdvUsd)}</span>
       </div>

       {/* Volume */}
       <div className="flex items-center gap-2">
         <Activity className="w-4 h-4 text-accent" />
        <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">{t('ticker.volume24h')}</span>
         <span className="font-mono font-bold text-foreground">{formatCompact(stats.volume24hUsd)}</span>
       </div>

       {/* Liquidity */}
       <div className="flex items-center gap-2 hidden sm:flex">
         <Droplets className="w-4 h-4 text-blue-400" />
        <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">{t('ticker.liquidity')}</span>
         <span className="font-mono font-bold text-foreground">{formatCompact(stats.liquidityUsd)}</span>
       </div>

       {/* Holders (Nur anzeigen wenn Daten da sind) */}
       {holders !== null && (
         <div className="flex items-center gap-2 hidden md:flex">
           <Users className="w-4 h-4 text-pink-400" />
          <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">{t('ticker.holders')}</span>
           <span className="font-mono font-bold text-foreground">{holders.toLocaleString()}</span>
         </div>
       )}

       {/* Call to Action */}
       <a 
         href={stats.pairUrl || "#"} 
         target="_blank" 
         rel="noreferrer"
         className="ml-4 flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase border border-primary/30 px-2 py-1 rounded-full hover:bg-primary/10"
       >
        <span>{t('ticker.trade')}</span>
         <ExternalLink className="w-3 h-3" />
       </a>
    </div>
  );

  if (loading && !stats.priceUsd) return null;

  return (
    <div className="w-full bg-black/60 border-y border-white/5 backdrop-blur-md overflow-hidden py-3 select-none relative z-20">
      {/* 
         Endless Loop mit CSS Animation 'marquee'.
         'hover:pause' erlaubt dem User, den Ticker anzuhalten.
         Wir rendern das Segment mehrfach, um den Loop lückenlos zu machen.
      */}
      <div className="flex w-max animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
        {[...Array(6)].map((_, i) => (
            <TickerSegment key={i} />
        ))}
      </div>
    </div>
  );
}

