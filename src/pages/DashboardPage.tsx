import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import type { DashboardDTO } from "@/types/dashboard";
import { useCopy } from "@/lib/theme/copy";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 16, background: "rgba(0,0,0,0.25)" }}>
      <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 10 }}>{title}</div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const t = useCopy();
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
    <PageShell
      spec={{
        page: "dashboard",
        flavor: "default",
        energy: 2,
      }}
    >
      <div style={{ minHeight: "100vh", padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ fontSize: 28, margin: 0 }}>{t('dashboard.title')}</h2>
        <div style={{ fontSize: 13, opacity: 0.75 }}>{t('dashboard.subtitle')}</div>
      </header>

      {loading && (
        <Card title={t('common.loading')}>
          <div style={{ opacity: 0.8 }}>{t('dashboard.loadingBody')}</div>
        </Card>
      )}

      {!loading && err && (
        <Card title={t('common.error')}>
          <div style={{ marginBottom: 10 }}>{err}</div>
          <button onClick={() => location.reload()} style={{ padding: "10px 12px", borderRadius: 12 }}>
            {t('common.retry')}
          </button>
        </Card>
      )}

      {!loading && !err && data && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          {/* Left column */}
          <div style={{ display: "grid", gap: 16 }}>
            <Card title={t('dashboard.userStatus.title')}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.08)" }} />
                <div>
                  <div style={{ fontSize: 16 }}>
                    {data.user.xHandle ? `@${data.user.xHandle}` : t('dashboard.userStatus.anonymous')}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.75 }}>
                    {t('dashboard.userStatus.status')} <b>{data.user.status}</b>
                    {data.system.lastSyncAt ? ` · ${t('dashboard.userStatus.synced', { date: new Date(data.system.lastSyncAt).toLocaleString() })}` : ""}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
                  {t('dashboard.userStatus.level')} <b>{data.user.level ?? 0}</b>
                </div>
                <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
                  {t('dashboard.userStatus.xp')} <b>{data.user.xp ? `${data.user.xp.current}/${data.user.xp.next}` : "0/0"}</b>
                </div>
                <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
                  {t('dashboard.userStatus.streak')} <b>{data.user.streak?.days ?? 0}d</b>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                {data.user.status === "anonymous" && (
                  <button style={{ padding: "10px 12px", borderRadius: 12 }}>{t('dashboard.userStatus.verify')}</button>
                )}
                {data.user.status === "verified" && (
                  <button style={{ padding: "10px 12px", borderRadius: 12 }}>{t('dashboard.userStatus.startAction')}</button>
                )}
                {data.user.status === "cooldown" && (
                  <div style={{ opacity: 0.8 }}>{t('dashboard.userStatus.cooldown')}</div>
                )}
                {data.user.status === "rate_limited" && (
                  <div style={{ opacity: 0.8 }}>{t('dashboard.userStatus.rateLimited')}</div>
                )}
              </div>
            </Card>

            <Card title={t('dashboard.actions.title')}>
              {data.actions.length === 0 ? (
                <div style={{ opacity: 0.8 }}>{t('dashboard.actions.empty')}</div>
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
                          {t(`actions.state.${a.state}`)}
                        </div>
                      </div>

                      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                          {a.rewardHint ? t('actions.reward', { reward: a.rewardHint }) : t('actions.rewardEmpty')}
                        </div>
                        <button
                          disabled={a.state !== "available"}
                          style={{ padding: "8px 10px", borderRadius: 12, opacity: a.state === "available" ? 1 : 0.5 }}
                        >
                          {t('dashboard.actions.cta')}
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
            <Card title={t('dashboard.badges.title')}>
              <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 10 }}>{t('dashboard.badges.earned')}</div>
              <div style={{ display: "grid", gap: 8 }}>
                {data.badges.earned.slice(0, 3).map((b) => (
                  <div key={b.id} style={{ padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 14 }}>{b.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(b.earnedAt).toLocaleString()}</div>
                  </div>
                ))}
                {data.badges.earned.length === 0 && <div style={{ opacity: 0.8 }}>{t('dashboard.badges.emptyEarned')}</div>}
              </div>

              <div style={{ fontSize: 13, opacity: 0.75, margin: "14px 0 10px" }}>{t('dashboard.badges.locked')}</div>
              <div style={{ display: "grid", gap: 8 }}>
                {data.badges.locked.slice(0, 3).map((b) => (
                  <div key={b.id} style={{ padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.04)", opacity: 0.8 }}>
                    <div style={{ fontSize: 14 }}>{b.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {b.progress ? `${b.progress.current}/${b.progress.target}` : "—"}
                    </div>
                  </div>
                ))}
                {data.badges.locked.length === 0 && <div style={{ opacity: 0.8 }}>{t('dashboard.badges.emptyLocked')}</div>}
              </div>
            </Card>

            <Card title={t('dashboard.rewards.title')}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>{t('dashboard.rewards.pending')}</div>
                <b>{data.rewards.pendingCount}</b>
              </div>

              <div style={{ marginTop: 12, fontSize: 13, opacity: 0.75 }}>{t('dashboard.rewards.recent')}</div>
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
                {data.rewards.recent.length === 0 && <div style={{ opacity: 0.8 }}>{t('dashboard.rewards.empty')}</div>}
              </div>
            </Card>

            <Card title={t('dashboard.system.title')}>
              {data.system.notices.length === 0 ? (
                <div style={{ opacity: 0.8 }}>{t('dashboard.system.empty')}</div>
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
    </PageShell>
  );
}

