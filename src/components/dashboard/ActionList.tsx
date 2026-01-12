import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { DashboardDTO } from "./types";

const formatCountdown = (value?: string) => {
  if (!value) return "";
  const diff = new Date(value).getTime() - Date.now();
  if (Number.isNaN(diff) || diff <= 0) return "Ready";
  const minutes = Math.ceil(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.ceil(minutes / 60);
  return `${hours}h`;
};

const ActionList = ({
  actions,
  status,
}: {
  actions: DashboardDTO["actions"];
  status: DashboardDTO["user"]["status"];
}) => {
  if (!actions || actions.length === 0) {
    return (
      <div className="glass-card p-6 rounded-2xl text-center">
        <p className="text-lg font-semibold">No data yet</p>
        <p className="text-sm text-muted-foreground mt-2">Complete your first action to see quests.</p>
        <Button variant="gradient" className="mt-4">
          {status === "anonymous" ? "Verify with X" : "Start Action"}
        </Button>
      </div>
    );
  }

  const visible = actions.slice(0, 3);
  const nextBest = visible.find((action) => action.state === "available")?.id;
  const actionsDisabled = status === "rate_limited";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Active Quests</h2>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Top 3</span>
      </div>
      <div className="grid gap-4">
        {visible.map((action) => {
          const isNext = action.id === nextBest;
          const progressPercent = action.progress
            ? (action.progress.current / action.progress.target) * 100
            : 0;
          return (
            <div
              key={action.id}
              className={`glass-card p-5 rounded-2xl border border-transparent transition ${
                isNext ? "border-primary/60 shadow-[0_0_24px_rgba(236,72,153,0.2)]" : ""
              } ${action.state === "locked" ? "opacity-60" : ""}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{action.title}</h3>
                    {isNext && (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                        Next best action
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                  {action.rewardHint && (
                    <p className="text-xs text-muted-foreground">Reward: {action.rewardHint}</p>
                  )}
                  {action.progress && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>
                          {action.progress.current}/{action.progress.target}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-start gap-2">
                  {action.state === "cooldown" && action.cooldownEndsAt && (
                    <span className="text-xs text-muted-foreground">
                      Cooldown {formatCountdown(action.cooldownEndsAt)}
                    </span>
                  )}
                  <Button
                    variant={action.state === "available" ? "gradient" : "outline"}
                    disabled={
                      actionsDisabled || action.state === "locked" || action.state === "completed"
                    }
                  >
                    {action.state === "available" && "Do it"}
                    {action.state === "cooldown" && "Cooldown"}
                    {action.state === "locked" && "Verify"}
                    {action.state === "completed" && "Completed"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {actionsDisabled && (
        <p className="text-xs text-orange-400">Rate limit active. Actions are temporarily disabled.</p>
      )}
    </div>
  );
};

export default ActionList;
