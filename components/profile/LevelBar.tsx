"use client";

import { cn } from "@/lib/utils";

interface LevelBarProps {
  level: number;
  xpTotal: number;
  className?: string;
}

export function LevelBar({ level, xpTotal, className }: LevelBarProps) {
  // Calculate progress to next level
  const LEVEL_THRESHOLDS: Record<number, number> = {
    1: 0,
    2: 10,
    3: 30,
    4: 70,
    5: 130,
    6: 220,
    7: 350,
    8: 520,
    9: 750,
    10: 1050,
  };

  const MAX_LEVEL = 10;
  const isMaxLevel = level >= MAX_LEVEL;
  
  const currentThreshold = LEVEL_THRESHOLDS[level] ?? 0;
  const nextThreshold = isMaxLevel 
    ? currentThreshold 
    : (LEVEL_THRESHOLDS[level + 1] ?? currentThreshold);
  
  const progressXP = xpTotal - currentThreshold;
  const requiredXP = nextThreshold - currentThreshold;
  const percentage = isMaxLevel 
    ? 100 
    : Math.min(100, Math.max(0, (progressXP / requiredXP) * 100));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold">Level {level}</span>
        {!isMaxLevel && (
          <span className="text-muted-foreground">
            {progressXP} / {requiredXP} XP
          </span>
        )}
        {isMaxLevel && (
          <span className="text-muted-foreground">MAX LEVEL</span>
        )}
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        Total XP: {xpTotal}
      </div>
    </div>
  );
}

