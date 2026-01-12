import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { DashboardDTO } from "@/types/dashboard";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 16, background: "rgba(0,0,0,0.25)" }}>
      <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 10 }}>{title}</div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiGet<DashboardDTO>("/api/dashboard")
      .then((d) => {
        if (!alive) return;
        setData(d);
        setErr(null);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load dashboard");
        setData(null);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ fontSize: 28, margin: 0 }}>Dashboard</h2>
        <div style={{ fontSize: 13, opacity: 0.75 }}>State-driven UI (no fake promises)</div>
      </header>

      {loading && (
        <Card title="Loading">
          <div style={{ opacity: 0.8 }}>Fetching your state…</div>
        </Card>
      )}

      {!loading && err && (
        <Card title="Error">
          <div style={{ marginBottom: 10 }}>{err}</div>
          <button onClick={() => location.reload()} style={{ padding: "10px 12px", borderRadius: 12 }}>
            Retry
          </button>
        </Card>
      )}

      {!loading && !err && data && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          {/* Left column */}
          <div style={{ display: "grid", gap: 16 }}>
            <Card title="User Status">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.08)" }} />
                <div>
                  <div style={{ fontSize: 16 }}>
                    {data.user.xHandle ? `@${data.user.xHandle}` : "Anonymous"}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.75 }}>
                    Status: <b>{data.user.status}</b>
                    {data.system.lastSyncAt ? ` · synced ${new Date(data.system.lastSyncAt).toLocaleString()}` : ""}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
                  Level: <b>{data.user.level ?? 0}</b>
                </div>
                <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
                  XP: <b>{data.user.xp ? `${data.user.xp.current}/${data.user.xp.next}` : "0/0"}</b>
                </div>
                <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
                  Streak: <b>{data.user.streak?.days ?? 0}d</b>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                {data.user.status === "anonymous" && (
                  <button style={{ padding: "10px 12px", borderRadius: 12 }}>Verify with X</button>
                )}
                {data.user.status === "verified" && (
                  <button style={{ padding: "10px 12px", borderRadius: 12 }}>Start Action</button>
                )}
                {data.user.status === "cooldown" && (
                  <div style={{ opacity: 0.8 }}>Cooldown active — check Actions below.</div>
                )}
                {data.user.status === "rate_limited" && (
                  <div style={{ opacity: 0.8 }}>Rate limited — try again later.</div>
                )}
              </div>
            </Card>

            <Card title="Actions (Top)">
              {data.actions.length === 0 ? (
                <div style={{ opacity: 0.8 }}>No actions available yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {data.actions.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.10)",
                        opacity: a.state === "locked" ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 15 }}>{a.title}</div>
                          <div style={{ fontSize: 13, opacity: 0.75 }}>{a.description}</div>
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.75, whiteSpace: "nowrap" }}>
                          {a.state.toUpperCase()}
                        </div>
                      </div>

                      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                          {a.rewardHint ? `Reward: ${a.rewardHint}` : "Reward: —"}
                        </div>
                        <button
                          disabled={a.state !== "available"}
                          style={{ padding: "8px 10px", borderRadius: 12, opacity: a.state === "available" ? 1 : 0.5 }}
                        >
                          Do
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right column */}
          <div style={{ display: "grid", gap: 16 }}>
            <Card title="Badges">
              <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 10 }}>Earned</div>
              <div style={{ display: "grid", gap: 8 }}>
                {data.badges.earned.slice(0, 3).map((b) => (
                  <div key={b.id} style={{ padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 14 }}>{b.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(b.earnedAt).toLocaleString()}</div>
                  </div>
                ))}
                {data.badges.earned.length === 0 && <div style={{ opacity: 0.8 }}>No badges yet.</div>}
              </div>

              <div style={{ fontSize: 13, opacity: 0.75, margin: "14px 0 10px" }}>Locked</div>
              <div style={{ display: "grid", gap: 8 }}>
                {data.badges.locked.slice(0, 3).map((b) => (
                  <div key={b.id} style={{ padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.04)", opacity: 0.8 }}>
                    <div style={{ fontSize: 14 }}>{b.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {b.progress ? `${b.progress.current}/${b.progress.target}` : "—"}
                    </div>
                  </div>
                ))}
                {data.badges.locked.length === 0 && <div style={{ opacity: 0.8 }}>No locked badges configured.</div>}
              </div>
            </Card>

            <Card title="Rewards (Read-only)">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>Pending queue</div>
                <b>{data.rewards.pendingCount}</b>
              </div>

              <div style={{ marginTop: 12, fontSize: 13, opacity: 0.75 }}>Recent</div>
              <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                {data.rewards.recent.slice(0, 5).map((r) => (
                  <div key={r.id} style={{ padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>{r.amountText}</div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{r.status}</div>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                ))}
                {data.rewards.recent.length === 0 && <div style={{ opacity: 0.8 }}>No payouts yet.</div>}
              </div>
            </Card>

            <Card title="System Notices">
              {data.system.notices.length === 0 ? (
                <div style={{ opacity: 0.8 }}>All good.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {data.system.notices.map((n) => (
                    <div key={n.id} style={{ padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{n.severity.toUpperCase()}</div>
                      <div style={{ fontSize: 14 }}>{n.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

