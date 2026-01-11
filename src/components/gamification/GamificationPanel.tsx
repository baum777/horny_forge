import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGamificationAction } from "../../hooks/useGamificationAction";
import { LevelChip } from "./LevelChip";
import { VisibilityChip } from "./VisibilityChip";
import { BadgeGrid } from "./BadgeGrid";
import { LEVEL_CURVE } from "../../gamification/incentives";

function nextLevelTarget(level: number) {
  const idx = LEVEL_CURVE.findIndex((r) => r.level === level);
  const next = LEVEL_CURVE[Math.min(idx + 1, LEVEL_CURVE.length - 1)];
  return next.lifetimeHornyEarned;
}

export function GamificationPanel() {
  const { stats, lastResult, loading, error, run } = useGamificationAction();

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm opacity-70">
            No stats loaded yet. Ensure server is running on http://localhost:3001.
          </div>
          {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
          <Button
            className="mt-4"
            disabled={loading}
            onClick={() => run("vote", { artifactId: "a1", clientNonce: crypto.randomUUID() })}
          >
            Trigger Action (Vote)
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
          <CardTitle>Progress</CardTitle>
          <div className="flex items-center gap-2">
            <LevelChip level={stats.level} />
            <VisibilityChip tier={lastResult?.tier ?? "private"} />
          </div>
        </CardHeader>

        <CardContent className="grid gap-4">
          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="grid gap-2">
            <div className="text-sm opacity-70">
              Lifetime earned <span className="font-semibold">$HORNY</span>:{" "}
              <span className="font-semibold">{stats.lifetimeHornyEarned}</span>
            </div>
            <Progress value={pct} />
            <div className="text-xs opacity-60">
              Next level target: {target} (daily: {stats.dailyHornyEarned} / weekly: {stats.weeklyHornyEarned})
            </div>
          </div>

          {lastResult && (
            <div className="rounded-xl border p-3 text-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div>
                  <span className="opacity-70">Δ $HORNY:</span>{" "}
                  <span className="font-semibold">{lastResult.deltaHorny}</span>
                </div>
                <div>
                  <span className="opacity-70">Feed weight:</span>{" "}
                  <span className="font-semibold">{lastResult.visibilityBoost.feedWeight.toFixed(2)}</span>
                </div>
                <div>
                  <span className="opacity-70">Features:</span>{" "}
                  <span className="font-semibold">
                    {lastResult.visibilityBoost.features.length ? lastResult.visibilityBoost.features.join(", ") : "—"}
                  </span>
                </div>
              </div>

              {(lastResult.newlyUnlockedBadges.length > 0 || lastResult.newlyUnlockedFeatures.length > 0) && (
                <div className="mt-3 text-xs opacity-70">
                  {lastResult.newlyUnlockedBadges.length > 0 && (
                    <div>New badges: {lastResult.newlyUnlockedBadges.join(", ")}</div>
                  )}
                  {lastResult.newlyUnlockedFeatures.length > 0 && (
                    <div>New unlocks: {lastResult.newlyUnlockedFeatures.join(", ")}</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button disabled={loading} onClick={() => run("vote", { artifactId: "a1", clientNonce: crypto.randomUUID() })}>
              Vote
            </Button>
            <Button disabled={loading} onClick={() => run("comment", { artifactId: "a1", clientNonce: crypto.randomUUID() })}>
              Comment
            </Button>
            <Button disabled={loading} onClick={() => run("forge", { clientNonce: crypto.randomUUID() })}>
              Forge
            </Button>
            <Button disabled={loading} onClick={() => run("artifact_release", { artifactId: "a1", clientNonce: crypto.randomUUID() })}>
              Release
            </Button>

            <Button
              disabled={loading}
              variant="secondary"
              onClick={() => run("votes_received", { artifactId: "a1", receivedVotesDelta: 12, clientNonce: crypto.randomUUID() })}
            >
              +12 Votes Received
            </Button>
            <Button
              disabled={loading}
              variant="secondary"
              onClick={() => run("time_spent", { timeDeltaSeconds: 180, clientNonce: crypto.randomUUID() })}
            >
              +180s Time
            </Button>
            <Button
              disabled={loading}
              variant="secondary"
              onClick={() =>
                run("quiz_complete", {
                  quizClassId: "moon-rider",
                  quizVector: { degen: 24, horny: 26, conviction: 25 },
                  clientNonce: crypto.randomUUID(),
                })
              }
            >
              Quiz Complete
            </Button>
            <Button disabled={loading} variant="secondary" onClick={() => run("share", { artifactId: "a1", clientNonce: crypto.randomUUID() })}>
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      <BadgeGrid unlocked={stats.unlockedBadges} />

      <Card>
        <CardHeader>
          <CardTitle>Unlocked Features</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.unlockedFeatures.length === 0 ? (
            <div className="text-sm opacity-70">No unlocks yet.</div>
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

