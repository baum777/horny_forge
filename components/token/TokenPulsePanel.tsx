"use client";

import { motion } from 'framer-motion';
import { RefreshCw, ExternalLink, Activity, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTokenStats } from '@/lib/hooks/useTokenStats';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const DEX_LINK = process.env.NEXT_PUBLIC_DEX_LINK || 'https://dexscreener.com';

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

export function TokenPulsePanel() {
  const { stats, holders, loading, error, refresh } = useTokenStats();
  const isLive = !stats.isStale && !error;
  const lastUpdated = stats.updatedAt ? new Date(stats.updatedAt) : null;

  const hasAnyValue =
    stats.priceUsd !== null ||
    stats.fdvUsd !== null ||
    stats.liquidityUsd !== null ||
    stats.volume24hUsd !== null ||
    holders !== null;

  if (loading && !hasAnyValue) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 rounded-xl"
    >
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

      {error && !hasAnyValue ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <AlertTriangle className="w-4 h-4 text-accent" />
          <span className="text-sm">Token pulse unstable.</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatItem label="Price" value={formatUsd(stats.priceUsd)} />
            <StatItem label="FDV" value={formatUsd(stats.fdvUsd)} />
            <StatItem label="Liquidity" value={formatUsd(stats.liquidityUsd)} />
            <StatItem label="24h Volume" value={formatUsd(stats.volume24hUsd)} />
            <StatItem label="Holders" value={formatCompactNumber(holders)} />
          </div>

          {lastUpdated && (
            <p className="text-xs text-muted-foreground mb-3">
              Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </p>
          )}

          <a
            href={stats.pairUrl || DEX_LINK}
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

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

