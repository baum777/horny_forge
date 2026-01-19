import { ShieldCheck, ShieldX, Timer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { DashboardDTO, DashboardStatus } from "./types";
import { useCopy } from "@/lib/theme/copy";

const statusConfig: Record<DashboardStatus, { labelKey: string; icon: JSX.Element; tone: string }> = {
  anonymous: {
    labelKey: "dashboard.status.anonymous",
    icon: <ShieldX className="h-4 w-4" />,
    tone: "text-destructive",
  },
  verified: {
    labelKey: "dashboard.status.verified",
    icon: <ShieldCheck className="h-4 w-4" />,
    tone: "text-emerald-400",
  },
  cooldown: {
    labelKey: "dashboard.status.cooldown",
    icon: <Timer className="h-4 w-4" />,
    tone: "text-amber-400",
  },
  rate_limited: {
    labelKey: "dashboard.status.rateLimited",
    icon: <Zap className="h-4 w-4" />,
    tone: "text-orange-400",
  },
};

const formatCountdown = (value: string | undefined, t: (key: string, params?: Record<string, number>) => string) => {
  if (!value) return "";
  const diff = new Date(value).getTime() - Date.now();
  if (Number.isNaN(diff) || diff <= 0) return t("dashboard.status.ready");
  const minutes = Math.ceil(diff / 60000);
  if (minutes < 60) return t("dashboard.status.minutes", { minutes });
  const hours = Math.ceil(minutes / 60);
  return t("dashboard.status.hours", { hours });
};

const UserStatusCard = ({
  user,
  nextBadgeHint,
  cooldownEndsAt,
}: {
  user: DashboardDTO["user"];
  nextBadgeHint?: string;
  cooldownEndsAt?: string;
}) => {
  const t = useCopy();
  const config = statusConfig[user.status];
  const xpPercent = user.xp && user.xp.next > 0 ? (user.xp.current / user.xp.next) * 100 : 0;

  return (
    <div className="glass-card p-6 rounded-2xl neon-border">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.xHandle ?? t("dashboard.userStatus.avatarAlt")}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/40"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted/40" />
            )}
            <div>
              <p className="text-lg font-semibold text-gradient">
                {user.xHandle ? `@${user.xHandle}` : t("dashboard.userStatus.unnamed")}
              </p>
              <div className={`flex items-center gap-2 text-xs uppercase tracking-widest ${config.tone}`}>
                {config.icon}
                <span>{t(config.labelKey)}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-end">
            {user.level !== undefined && (
              <div className="text-sm">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("dashboard.userStatus.level")}</p>
                <p className="text-2xl font-bold">{user.level}</p>
              </div>
            )}
            {user.streak?.days !== undefined && (
              <div className="text-sm">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("dashboard.userStatus.streak")}</p>
                <p className="text-2xl font-bold">{t("dashboard.userStatus.streakValue", { days: user.streak.days })}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          {user.xp ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>{t("dashboard.userStatus.xp")}</span>
                <span>
                  {user.xp.current}/{user.xp.next}
                </span>
              </div>
              <Progress value={xpPercent} className="h-2" />
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {user.streak?.endsAt && <span>{t("dashboard.userStatus.streakEnds", { time: formatCountdown(user.streak.endsAt, t) })}</span>}
                {nextBadgeHint && <span>{t("dashboard.userStatus.nextBadge", { hint: nextBadgeHint })}</span>}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">{t("dashboard.userStatus.noXp")}</div>
          )}

          <div className="flex items-center justify-start lg:justify-end">
            {user.status === "anonymous" && (
              <Button variant="gradient" className="w-full sm:w-auto">
                {t("dashboard.userStatus.verify")}
              </Button>
            )}
            {user.status === "verified" && (
              <Button variant="gradient" className="w-full sm:w-auto">
                {t("dashboard.userStatus.startAction")}
              </Button>
            )}
            {user.status === "cooldown" && (
              <div className="text-sm text-muted-foreground">
                {t("dashboard.userStatus.cooldownLabel", { time: formatCountdown(cooldownEndsAt, t) })}
              </div>
            )}
            {user.status === "rate_limited" && (
              <div className="text-sm text-muted-foreground">{t("dashboard.userStatus.rateLimitedNote")}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStatusCard;
