import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import { useCopy } from "@/lib/theme/copy";

type RewardsDTO = {
  user: { status: "anonymous" | "verified" | "cooldown" | "rate_limited"; id?: string };
  summary: {
    pendingCount: number;
    paidCount?: number;
    failedCount?: number;
    yourPendingPosition?: number; // 1-based index in queue if derivable
  };
  pendingQueue: Array<{
    id: string;
    createdAt: string;
    amountText: string;
    status: "pending";
    mine?: boolean;
  }>;
  recent: Array<{
    id: string;
    createdAt: string;
    amountText: string;
    status: "pending" | "paid" | "failed";
    txUrl?: string; // later: link to explorer
  }>;
  rules: Array<{ id: string; title: string; text: string }>;
  system: { notices: Array<{ id: string; severity: "info" | "warn" | "error"; text: string }> };
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: 16,
        background: "rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 10 }}>{title}</div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.06)" }}>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>
      <div style={{ fontSize: 18, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default function RewardsPage() {
  const t = useCopy();
  const [data, setData] = useState<RewardsDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<"all" | "mine">("all");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiGet<RewardsDTO>("/api/rewards")
      .then((d) => {
        if (!alive) return;
        setData(d);
        setErr(null);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load rewards");
        setData(null);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const pendingList = useMemo(() => {
    if (!data) return [];
    if (filter === "mine") return data.pendingQueue.filter((x) => x.mine);
    return data.pendingQueue;
  }, [data, filter]);

  const recentList = useMemo(() => {
    if (!data) return [];
    if (filter === "mine") {
      // Filter recent to only show items that are in pendingQueue and marked as mine
      const mineIds = new Set(data.pendingQueue.filter((p) => p.mine).map((p) => p.id));
      return data.recent.filter((r) => mineIds.has(r.id));
    }
    return data.recent;
  }, [data, filter]);

  return (
    <PageShell
      spec={{
        page: "rewards",
        flavor: "subtle",
        energy: 1,
      }}
    >
      <div style={{ minHeight: "100vh", padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ fontSize: 28, margin: 0 }}>{t('rewards.title')}</h2>
        <div style={{ fontSize: 13, opacity: 0.75 }}>{t('rewards.subtitle')}</div>
      </header>

      {loading && (
        <Card title={t('common.loading')}>
          <div style={{ opacity: 0.8 }}>{t('rewards.loadingBody')}</div>
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
        <div style={{ display: "grid", gap: 16 }}>
          {data.system.notices.length > 0 && (
            <Card title={t('rewards.notices')}>
              <div style={{ display: "grid", gap: 8 }}>
                {data.system.notices.map((n) => (
                  <div key={n.id} style={{ padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{n.severity.toUpperCase()}</div>
                    <div style={{ fontSize: 14 }}>{n.text}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title={t('rewards.snapshot')}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <Stat label={t('rewards.stats.pending')} value={<b>{data.summary.pendingCount}</b>} />
              <Stat label={t('rewards.stats.position')} value={<b>{data.summary.yourPendingPosition ?? "—"}</b>} />
              <Stat label={t('rewards.stats.paid')} value={<b>{data.summary.paidCount ?? "—"}</b>} />
              <Stat label={t('rewards.stats.failed')} value={<b>{data.summary.failedCount ?? "—"}</b>} />
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => setFilter("all")}
                style={{ padding: "8px 10px", borderRadius: 12, opacity: filter === "all" ? 1 : 0.6 }}
              >
                {t('rewards.filters.all')}
              </button>
              <button
                onClick={() => setFilter("mine")}
                style={{ padding: "8px 10px", borderRadius: 12, opacity: filter === "mine" ? 1 : 0.6 }}
              >
                {t('rewards.filters.mine')}
              </button>

              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {t('rewards.notice')}
              </div>
            </div>
          </Card>

          <Card title={t('rewards.pending.title')}>
            <div style={{ display: "grid", gap: 10 }}>
              {pendingList.slice(0, 50).map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: p.mine ? "rgba(255,255,255,0.08)" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14 }}>
                        {t('rewards.pending.item', {
                          index: idx + 1,
                          amount: p.amountText,
                          mine: p.mine ? t('rewards.pending.you') : '',
                        })}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{new Date(p.createdAt).toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{t('rewards.status.pending')}</div>
                  </div>
                </div>
              ))}
              {pendingList.length === 0 && <div style={{ opacity: 0.8 }}>{t('rewards.pending.empty')}</div>}
            </div>
          </Card>

          <Card title={t('rewards.recent.title')}>
            <div style={{ display: "grid", gap: 10 }}>
              {recentList.slice(0, 50).map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14 }}>{r.amountText}</div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{new Date(r.createdAt).toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{t(`rewards.status.${r.status}`)}</div>
                  </div>

                  {r.txUrl && (
                    <div style={{ marginTop: 8, fontSize: 12 }}>
                      <a href={r.txUrl} target="_blank" rel="noreferrer" style={{ opacity: 0.85 }}>
                        {t('rewards.recent.viewTx')}
                      </a>
                    </div>
                  )}
                </div>
              ))}
              {recentList.length === 0 && <div style={{ opacity: 0.8 }}>{t('rewards.recent.empty')}</div>}
            </div>
          </Card>

          <Card title={t('rewards.rules.title')}>
            <div style={{ display: "grid", gap: 10 }}>
              {data.rules.map((rule) => (
                <div key={rule.id} style={{ padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 14 }}>{rule.title}</div>
                  <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>{rule.text}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      </div>
    </PageShell>
  );
}

