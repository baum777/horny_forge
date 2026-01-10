import { BADGE_DEFINITIONS, BADGE_ICON_PATHS, type BadgeId } from 'lib/gamification/badgeRules';
import { cn } from '@/lib/utils';

interface BadgeGridProps {
  unlockedBadges: BadgeId[];
}

export function BadgeGrid({ unlockedBadges }: BadgeGridProps) {
  const unlockedSet = new Set(unlockedBadges);

  return (
    <div className="glass-card p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Signals & Marks</h3>
        <span className="text-xs text-muted-foreground">
          {unlockedBadges.length}/{BADGE_DEFINITIONS.length} unlocked
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {BADGE_DEFINITIONS.map((badge) => {
          const unlocked = unlockedSet.has(badge.badge_id);
          return (
            <div
              key={badge.badge_id}
              className={cn(
                'rounded-xl border border-border/40 p-3 space-y-2 text-center transition-all',
                unlocked
                  ? 'bg-background/60 shadow-[0_0_20px_rgba(255,228,77,0.15)]'
                  : 'bg-muted/30 opacity-60'
              )}
            >
              <div className="mx-auto h-16 w-16 rounded-lg bg-black/70 flex items-center justify-center">
                <img
                  src={BADGE_ICON_PATHS[badge.badge_id]}
                  alt={badge.name}
                  className={cn('h-10 w-10', !unlocked && 'grayscale')}
                />
              </div>
              <div className="text-xs font-semibold">{badge.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {unlocked ? badge.description : 'Locked'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
