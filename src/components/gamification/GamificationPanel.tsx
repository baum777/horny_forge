import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGamificationAction } from "../../hooks/useGamificationAction";
import { LevelChip } from "./LevelChip";
import { VisibilityChip } from "./VisibilityChip";
import { BadgeGrid } from "./BadgeGrid";
import { LEVEL_CURVE } from "../../gamification/incentives";
import { ALL_BADGES } from "../../badges/unifiedBadges";
import { useCopy } from "@/lib/theme/copy";

function nextLevelTarget(level: number) {
  const idx = LEVEL_CURVE.findIndex((r) => r.level === level);
  const next = LEVEL_CURVE[Math.min(idx + 1, LEVEL_CURVE.length - 1)];
  return next.lifetimeHornyEarned;
}

export function GamificationPanel() {
  const t = useCopy();
  const { stats, lastResult, loading, error, run } = useGamificationAction();
  const badgeNameById = (id: string) => {
    const badge = ALL_BADGES.find((entry) => entry.id === id);
    return badge ? t(badge.nameKey) : id;
  };

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("gamification.progress.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm opacity-70">
            {t("gamification.progress.empty")}
          </div>
          {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
          <Button
            className="mt-4"
            disabled={loading}
            onClick={() => run("vote", { artifactId: "a1", clientNonce: crypto.randomUUID() })}
          >
            {t("gamification.progress.trigger")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const target = nextLevelTarget(stats.level);
  const pct = target === 0 ? 0 : Math.min(100, Math.round((stats.lifetimeHornyEarned / target) * 100));

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{t("gamification.progress.title")}</CardTitle>
          <div className="flex items-center gap-2">
            <LevelChip level={stats.level} />
            <VisibilityChip tier={lastResult?.tier ?? "private"} />
          </div>
        </CardHeader>

        <CardContent className="grid gap-4">
          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="grid gap-2">
            <div className="text-sm opacity-70">
              {t("gamification.progress.lifetimeLabel")}{" "}
              <span className="font-semibold">{stats.lifetimeHornyEarned}</span>
            </div>
            <Progress value={pct} />
            <div className="text-xs opacity-60">
              {t("gamification.progress.nextTarget", {
                target,
                daily: stats.dailyHornyEarned,
                weekly: stats.weeklyHornyEarned,
              })}
            </div>
          </div>

          {lastResult && (
            <div className="rounded-xl border p-3 text-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div>
                  <span className="opacity-70">{t("gamification.result.delta")} </span>
                  <span className="font-semibold">{lastResult.deltaHorny}</span>
                </div>
                <div>
                  <span className="opacity-70">{t("gamification.result.feedWeight")} </span>
                  <span className="font-semibold">{lastResult.visibilityBoost.feedWeight.toFixed(2)}</span>
                </div>
                <div>
                  <span className="opacity-70">{t("gamification.result.features")} </span>
                  <span className="font-semibold">
                    {lastResult.visibilityBoost.features.length ? lastResult.visibilityBoost.features.join(", ") : "—"}
                  </span>
                </div>
              </div>

              {(lastResult.newlyUnlockedBadges.length > 0 || lastResult.newlyUnlockedFeatures.length > 0) && (
                <div className="mt-3 text-xs opacity-70">
                  {lastResult.newlyUnlockedBadges.length > 0 && (
                    <div>
                      {t("gamification.result.newBadges", {
                        list: lastResult.newlyUnlockedBadges.map(badgeNameById).join(", "),
                      })}
                    </div>
                  )}
                  {lastResult.newlyUnlockedFeatures.length > 0 && (
                    <div>{t("gamification.result.newUnlocks", { list: lastResult.newlyUnlockedFeatures.join(", ") })}</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button disabled={loading} onClick={() => run("vote", { artifactId: "a1", clientNonce: crypto.randomUUID() })}>
              {t("gamification.actions.vote")}
            </Button>
            <Button disabled={loading} onClick={() => run("comment", { artifactId: "a1", clientNonce: crypto.randomUUID() })}>
              {t("gamification.actions.comment")}
            </Button>
            <Button disabled={loading} onClick={() => run("forge", { clientNonce: crypto.randomUUID() })}>
              {t("gamification.actions.generate")}
            </Button>
            <Button disabled={loading} onClick={() => run("artifact_release", { artifactId: "a1", clientNonce: crypto.randomUUID() })}>
              {t("gamification.actions.release")}
            </Button>

            <Button
              disabled={loading}
              variant="secondary"
              onClick={() => run("votes_received", { artifactId: "a1", receivedVotesDelta: 12, clientNonce: crypto.randomUUID() })}
            >
              {t("gamification.actions.votesReceived", { count: 12 })}
            </Button>
            <Button
              disabled={loading}
              variant="secondary"
              onClick={() => run("time_spent", { timeDeltaSeconds: 180, clientNonce: crypto.randomUUID() })}
            >
              {t("gamification.actions.time", { seconds: 180 })}
            </Button>
            <Button
              disabled={loading}
              variant="secondary"
              onClick={() =>
                run("share", {
                  artifactId: "a1",
                  clientNonce: crypto.randomUUID(),
                })
              }
            >
              {t("gamification.actions.share")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <BadgeGrid unlocked={stats.unlockedBadges} />

      <Card>
        <CardHeader>
          <CardTitle>{t("gamification.features.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.unlockedFeatures.length === 0 ? (
            <div className="text-sm opacity-70">{t("gamification.features.empty")}</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stats.unlockedFeatures.map((u) => (
                <span key={u} className="text-xs rounded-full border px-3 py-1">
                  {u}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

