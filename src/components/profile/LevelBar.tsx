import { Progress } from '@/components/ui/progress';
import { getLevelProgress } from 'lib/gamification/levels';
import { clientGamificationEnabled } from '@/lib/gamificationFlags';

interface LevelBarProps {
  xpTotal: number;
  level: number;
}

export function LevelBar({ xpTotal, level }: LevelBarProps) {
  const progress = clientGamificationEnabled ? getLevelProgress(xpTotal) : null;
  const nextXpLabel = progress?.nextXp ? `${xpTotal}/${progress.nextXp}` : `${xpTotal}`;

  return (
    <div className="glass-card p-5 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Level</p>
          <p className="text-3xl font-bold text-gradient">{level}</p>
        </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">XP</p>
        <p className="text-sm font-semibold">{nextXpLabel}</p>
      </div>
    </div>
      <Progress value={progress?.progressPercent ?? 0} className="h-3" />
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Current XP: {progress?.currentXp ?? xpTotal}</span>
        <span>
          {progress?.nextLevel ? `Next Level ${progress.nextLevel}` : 'Next Level: server-defined'}
        </span>
      </div>
    </div>
  );
}
