import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  mockFeed,
  type PriceData,
  formatPrice,
  formatMarketCap,
  formatChange,
  getVelocityLabel,
} from '@/lib/mockFeed';
import { getFOMOAlert, setFOMOAlert, clearFOMOAlert, unlockBadge } from '@/lib/storage';

export default function FOMOTracker() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [alert, setAlertState] = useState(getFOMOAlert());
  const [alertThreshold, setAlertThreshold] = useState('10');
  const [alertDirection, setAlertDirection] = useState<'up' | 'down'>('up');
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [basePrice, setBasePrice] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = mockFeed.subscribe((data) => {
      setPriceData(data);
      
      // Set base price for alert calculation on first data
      if (!basePrice) {
        setBasePrice(data.price);
      }

      // Check alert condition
      const currentAlert = getFOMOAlert();
      if (currentAlert?.armed && basePrice) {
        const changePercent = ((data.price - basePrice) / basePrice) * 100;
        
        if (
          (currentAlert.direction === 'up' && changePercent >= currentAlert.threshold) ||
          (currentAlert.direction === 'down' && changePercent <= -currentAlert.threshold)
        ) {
          toast.success(
            `🔔 FOMO ALERT TRIGGERED! Price ${currentAlert.direction === 'up' ? 'up' : 'down'} ${Math.abs(changePercent).toFixed(2)}%`,
            { duration: 8000 }
          );
          clearFOMOAlert();
          setAlertState(null);
        }
      }
    });

    return unsubscribe;
  }, [basePrice]);

  const handleSetAlert = () => {
    const threshold = parseFloat(alertThreshold);
    if (isNaN(threshold) || threshold <= 0) {
      toast.error('Not horny enough. Enter a valid threshold.');
      return;
    }

    const newAlert = {
      threshold,
      direction: alertDirection,
      armed: true,
    };
    
    setFOMOAlert(newAlert);
    setAlertState(newAlert);
    setShowAlertForm(false);
    setBasePrice(priceData?.price || null);
    unlockBadge('fomo-armed');
    toast.success(`🔔 Alert armed: ${alertDirection === 'up' ? '+' : '-'}${threshold}%`);
  };

  const handleClearAlert = () => {
    clearFOMOAlert();
    setAlertState(null);
    toast.info('Alert disarmed');
  };

  if (!priceData) {
    return (
      <GlassCard variant="neon" className="animate-pulse">
        <div className="h-48 flex items-center justify-center">
          <span className="text-muted-foreground">Loading FOMO data...</span>
        </div>
      </GlassCard>
    );
  }

  const isPositive = priceData.change24h >= 0;

  return (
    <GlassCard variant="neon" className="overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">FOMO Tracker</h3>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            priceData.hornyVelocity >= 70
              ? 'bg-secondary/20 text-secondary'
              : priceData.hornyVelocity >= 40
              ? 'bg-primary/20 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <Zap className="w-3 h-3" />
          {getVelocityLabel(priceData.hornyVelocity)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Price */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">$HORNY Price</p>
          <motion.p
            key={priceData.price}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold font-mono"
          >
            ${formatPrice(priceData.price)}
          </motion.p>
        </div>

        {/* 24h Change */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">24h Change</p>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <motion.span
              key={priceData.change24h}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-lg font-bold"
            >
              {formatChange(priceData.change24h)}
            </motion.span>
          </div>
        </div>

        {/* Market Cap */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
          <p className="font-semibold">{formatMarketCap(priceData.marketCap)}</p>
        </div>

        {/* Horny Velocity */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Horny Velocity</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${priceData.hornyVelocity}%` }}
                className="h-full"
                style={{
                  background:
                    priceData.hornyVelocity >= 70
                      ? 'hsl(var(--secondary))'
                      : priceData.hornyVelocity >= 40
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--muted-foreground))',
                }}
              />
            </div>
            <span className="text-xs font-mono">{priceData.hornyVelocity}%</span>
          </div>
        </div>
      </div>

      {/* Alert Section */}
      <div className="pt-4 border-t border-border">
        {alert?.armed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-sm">
                Alert armed: {alert.direction === 'up' ? '+' : '-'}{alert.threshold}%
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearAlert}>
              <BellOff className="w-4 h-4 mr-1" />
              Disarm
            </Button>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {showAlertForm ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex gap-2">
                    <Button
                      variant={alertDirection === 'up' ? 'gradient' : 'outline'}
                      size="sm"
                      onClick={() => setAlertDirection('up')}
                      className="flex-1"
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Up
                    </Button>
                    <Button
                      variant={alertDirection === 'down' ? 'gradient' : 'outline'}
                      size="sm"
                      onClick={() => setAlertDirection('down')}
                      className="flex-1"
                    >
                      <TrendingDown className="w-4 h-4 mr-1" />
                      Down
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Threshold %"
                      value={alertThreshold}
                      onChange={(e) => setAlertThreshold(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="gradient" onClick={handleSetAlert}>
                      Arm
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAlertForm(false)}>
                    Cancel
                  </Button>
                </motion.div>
              ) : (
                <Button variant="neon" className="w-full" onClick={() => setShowAlertForm(true)}>
                  <Bell className="w-4 h-4 mr-2" />
                  Set FOMO Alert
                </Button>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Integration note */}
      <p className="mt-4 text-xs text-muted-foreground text-center">
        🔌 Mock feed • Real price API integration ready
      </p>
    </GlassCard>
  );
}
