import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { getHornyMeter, setHornyMeter, addToHornyMeter, unlockBadge } from '@/lib/storage';

// Messages that change based on meter level
const getMeterMessage = (level: number): string => {
  if (level >= 100) return 'MAXIMUM HORNY';
  if (level >= 80) return 'UNSTABLE DESIRE';
  if (level >= 60) return 'ELEVATED';
  if (level >= 40) return 'WARMING UP';
  if (level >= 20) return 'AWAKENING';
  return 'DORMANT';
};

export default function HornyMeter() {
  const [level, setLevel] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    // Load initial level
    setLevel(getHornyMeter());

    // Track time on page
    const startTime = Date.now();
    const timeInterval = setInterval(() => {
      const secondsElapsed = Math.floor((Date.now() - startTime) / 1000);
      if (secondsElapsed >= 90) {
        unlockBadge('time-spent');
      }
      // Add 1% every 15 seconds
      if (secondsElapsed > 0 && secondsElapsed % 15 === 0) {
        const newLevel = addToHornyMeter(1);
        setLevel(newLevel);
        setShowPulse(true);
        setTimeout(() => setShowPulse(false), 500);
      }
    }, 1000);

    // Track scroll depth
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (window.scrollY / scrollHeight) * 100;
      
      if (scrollPercent > 80) {
        const newLevel = addToHornyMeter(2);
        setLevel(newLevel);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (level >= 100) {
      unlockBadge('full-meter');
    }
  }, [level]);

  // Expose method to add to meter from other components
  useEffect(() => {
    const handleMeterAdd = (e: CustomEvent<number>) => {
      const newLevel = addToHornyMeter(e.detail);
      setLevel(newLevel);
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 500);
    };

    window.addEventListener('horny-meter-add' as any, handleMeterAdd as any);
    return () => window.removeEventListener('horny-meter-add' as any, handleMeterAdd as any);
  }, []);

  const glowIntensity = Math.min(30, level / 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="fixed bottom-4 right-4 z-40"
    >
      <motion.div
        className="relative cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Glow effect based on level */}
        <div
          className="absolute inset-0 rounded-full blur-xl transition-all duration-500"
          style={{
            background: `radial-gradient(circle, hsl(var(--primary) / ${level / 100}) 0%, transparent 70%)`,
            transform: `scale(${1 + level / 100})`,
          }}
        />

        {/* Main button */}
        <div
          className={`relative flex items-center gap-2 px-4 py-3 rounded-full bg-card border border-primary/50 transition-all duration-300 ${
            showPulse ? 'animate-pulse' : ''
          }`}
          style={{
            boxShadow: `0 0 ${glowIntensity}px hsl(var(--primary) / 0.5)`,
          }}
        >
          <Flame
            className="w-5 h-5 text-primary"
            style={{
              filter: `drop-shadow(0 0 ${glowIntensity / 2}px hsl(var(--primary)))`,
            }}
          />
          <span className="font-bold text-sm">{level}%</span>
        </div>

        {/* Expanded panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-full right-0 mb-2 w-48 p-4 rounded-xl bg-card border border-border"
            >
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">HORNY METER</h4>
              
              {/* Progress bar */}
              <div className="h-3 rounded-full bg-muted overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${level}%` }}
                  className="h-full bg-gradient-horny"
                />
              </div>

              {/* Status */}
              <p
                className="text-sm font-bold text-center"
                style={{
                  color: level >= 80 ? 'hsl(var(--secondary))' : level >= 50 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                }}
              >
                {getMeterMessage(level)}
              </p>

              <p className="text-xs text-muted-foreground text-center mt-2">
                +Scroll +Time +Actions
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// Helper to dispatch meter add events
export function addHornyMeter(amount: number) {
  window.dispatchEvent(new CustomEvent('horny-meter-add', { detail: amount }));
}
