import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { mockFeed, type PriceData, formatPrice, formatChange } from '@/lib/mockFeed';

export default function LiveTicker() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = mockFeed.subscribe((data) => {
      setPreviousPrice(priceData?.price || null);
      setPriceData(data);
    });

    return unsubscribe;
  }, [priceData?.price]);

  if (!priceData) return null;

  const isUp = previousPrice ? priceData.price > previousPrice : priceData.change24h >= 0;
  const flashColor = isUp ? 'text-green-500' : 'text-red-500';

  return (
    <div className="w-full overflow-hidden bg-card/50 border-y border-border">
      <div className="animate-[marquee_30s_linear_infinite] flex items-center gap-8 py-2 px-4 whitespace-nowrap">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold">$HORNY</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={priceData.price}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`font-mono font-semibold ${flashColor}`}
                >
                  ${formatPrice(priceData.price)}
                </motion.span>
              </AnimatePresence>
              {isUp ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">24h:</span>
              <span className={priceData.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                {formatChange(priceData.change24h)}
              </span>
            </div>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              Horny Velocity: <span className="text-primary">{priceData.hornyVelocity}%</span>
            </span>
            <span className="text-muted-foreground">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
