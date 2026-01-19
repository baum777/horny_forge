import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import { useCopy } from "@/lib/theme/copy";

type StatusDTO = {
  overall: "ok" | "degraded" | "down";
  checkedAt: string;
  services: Array<{
    id: string;
    name: string;
    status: "ok" | "degraded" | "down";
    latencyMs?: number;
    lastOkAt?: string;
    message?: string;
  }>;
  config: {
    tokenSymbol?: string;
    frontendUrl?: string;
    env?: "production" | "staging" | "development";
    features: Record<string, boolean>;
  };
  system: {
    notices: Array<{ id: string; severity: "info" | "warn" | "error"; text: string }>;
  };
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

function Dot({ status }: { status: "ok" | "degraded" | "down" }) {
  const bg =
    status === "ok" ? "rgba(255,255,255,0.80)" : status === "degraded" ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.20)";
  return <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 999, background: bg, marginRight: 8 }} />;
}

export default function StatusPage() {
  const t = useCopy();
  const [data, setData] = useState<StatusDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiGet<StatusDTO>("/api/status")
      .then((d) => {
        if (!alive) return;
        setData(d);
        setErr(null);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load status");
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
        page: "status",
        flavor: "subtle",
        energy: 1,
      }}
    >
      <div style={{ minHeight: "100vh", padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ fontSize: 28, margin: 0 }}>{t('status.title')}</h2>
        <div style={{ fontSize: 13, opacity: 0.75 }}>
          {data ? t('status.checkedAt', { date: new Date(data.checkedAt).toLocaleString() }) : ""}
        </div>
      </header>

      {loading && (
        <Card title={t('common.loading')}>
          <div style={{ opacity: 0.8 }}>{t('status.loadingBody')}</div>
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
            <Card title={t('status.notices')}>
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

          <Card title={t('status.overall')}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Dot status={data.overall === "ok" ? "ok" : data.overall === "degraded" ? "degraded" : "down"} />
              <div style={{ fontSize: 18 }}>
                <b>{t(`status.state.${data.overall}`)}</b>
              </div>
            </div>
          </Card>

          <Card title={t('status.services')}>
            <div style={{ display: "grid", gap: 10 }}>
              {data.services.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14 }}>
                      <Dot status={s.status} />
                      {s.name}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75, marginLeft: 18 }}>
                      {s.message ?? "—"}
                      {s.lastOkAt ? ` · ${t('status.lastOk', { date: new Date(s.lastOkAt).toLocaleString() })}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75, whiteSpace: "nowrap" }}>
                    {typeof s.latencyMs === "number" ? `${s.latencyMs}ms` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={t('status.config')}>
            <div style={{ display: "grid", gap: 10 }}>
              <Row label={t('status.env')} value={data.config.env ?? "—"} />
              <Row label={t('status.token')} value={data.config.tokenSymbol ?? "—"} />
              <Row label={t('status.frontendUrl')} value={data.config.frontendUrl ?? "—"} />

              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>{t('status.features')}</div>
              <div style={{ display: "grid", gap: 8 }}>
                {Object.entries(data.config.features).map(([k, v]) => (
                  <Row key={k} label={k} value={v ? t('status.on') : t('status.off')} />
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
      </div>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: 10, borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
      <div style={{ fontSize: 13, opacity: 0.75 }}>{label}</div>
      <div style={{ fontSize: 13 }}>{value}</div>
    </div>
  );
}

