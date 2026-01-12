import { ShieldCheck, ShieldX, Timer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { DashboardDTO, DashboardStatus } from "./types";

const statusConfig: Record<DashboardStatus, { label: string; icon: JSX.Element; tone: string }> = {
  anonymous: {
    label: "Anonymous",
    icon: <ShieldX className="h-4 w-4" />,
    tone: "text-destructive",
  },
  verified: {
    label: "Verified",
    icon: <ShieldCheck className="h-4 w-4" />,
    tone: "text-emerald-400",
  },
  cooldown: {
    label: "Cooldown",
    icon: <Timer className="h-4 w-4" />,
    tone: "text-amber-400",
  },
  rate_limited: {
    label: "Rate limited",
    icon: <Zap className="h-4 w-4" />,
    tone: "text-orange-400",
  },
};

const formatCountdown = (value?: string) => {
  if (!value) return "";
  const diff = new Date(value).getTime() - Date.now();
  if (Number.isNaN(diff) || diff <= 0) return "Ready soon";
  const minutes = Math.ceil(diff / 60000);
  if (minutes < 60) return `${minutes}m remaining`;
  const hours = Math.ceil(minutes / 60);
  return `${hours}h remaining`;
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
                alt={user.xHandle ?? "User avatar"}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/40"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted/40" />
            )}
            <div>
              <p className="text-lg font-semibold text-gradient">
                {user.xHandle ? `@${user.xHandle}` : "Unnamed explorer"}
              </p>
              <div className={`flex items-center gap-2 text-xs uppercase tracking-widest ${config.tone}`}>
                {config.icon}
                <span>{config.label}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-end">
            {user.level !== undefined && (
              <div className="text-sm">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Level</p>
                <p className="text-2xl font-bold">{user.level}</p>
              </div>
            )}
            {user.streak?.days !== undefined && (
              <div className="text-sm">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">{user.streak.days} days</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          {user.xp ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>XP</span>
                <span>
                  {user.xp.current}/{user.xp.next}
                </span>
              </div>
              <Progress value={xpPercent} className="h-2" />
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {user.streak?.endsAt && <span>Streak ends {formatCountdown(user.streak.endsAt)}</span>}
                {nextBadgeHint && <span>Next badge: {nextBadgeHint}</span>}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No XP tracked yet.</div>
          )}

          <div className="flex items-center justify-start lg:justify-end">
            {user.status === "anonymous" && (
              <Button variant="gradient" className="w-full sm:w-auto">
                Verify with X
              </Button>
            )}
            {user.status === "verified" && (
              <Button variant="gradient" className="w-full sm:w-auto">
                Start Action
              </Button>
            )}
            {user.status === "cooldown" && (
              <div className="text-sm text-muted-foreground">
                Cooldown: {formatCountdown(cooldownEndsAt)}
              </div>
            )}
            {user.status === "rate_limited" && (
              <div className="text-sm text-muted-foreground">Actions paused due to rate limit</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStatusCard;
