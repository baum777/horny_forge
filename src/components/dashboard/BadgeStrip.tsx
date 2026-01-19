import { Progress } from "@/components/ui/progress";
import type { DashboardDTO } from "./types";
import { useCopy } from "@/lib/theme/copy";

const BadgeStrip = ({ badges }: { badges: DashboardDTO["badges"] }) => {
  const t = useCopy();
  const earned = badges?.earned?.slice(0, 3) ?? [];
  const locked = badges?.locked?.slice(0, 3) ?? [];

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold">{t('dashboard.badges.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('dashboard.badges.subtitle')}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{t('dashboard.badges.latest')}</p>
            {earned.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.badges.emptyEarned')}</p>
            ) : (
              <div className="space-y-3">
                {earned.map((badge) => (
                  <div key={badge.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                      <span>{badge.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{badge.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('dashboard.badges.earnedAt', { date: badge.earnedAt })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{t('dashboard.badges.locked')}</p>
            {locked.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.badges.emptyLocked')}</p>
            ) : (
              <div className="space-y-3">
                {locked.map((badge) => {
                  const progress = badge.progress
                    ? (badge.progress.current / badge.progress.target) * 100
                    : 0;
                  return (
                    <div key={badge.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center opacity-60">
                        <span>{badge.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{badge.name}</p>
                        {badge.progress ? (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                {badge.progress.current}/{badge.progress.target}
                              </span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">{t('dashboard.badges.lockedLabel')}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgeStrip;
