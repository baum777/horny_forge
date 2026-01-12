import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type ActionsDTO = {
  user: { status: "anonymous" | "verified" | "cooldown" | "rate_limited" };
  actions: Array<{
    id: string;
    title: string;
    description: string;
    category: "daily" | "social" | "event" | "progression";
    state: "available" | "cooldown" | "locked" | "completed";
    cooldownEndsAt?: string;
    progress?: { current: number; target: number };
    rewardHint?: string;
    cta:
      | { type: "verify_x"; label: string }
      | { type: "open_url"; label: string; url: string }
      | { type: "call_api"; label: string; method: "POST"; path: string; body?: any }
      | { type: "disabled"; label: string; reason?: string };
  }>;
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

export default function ActionsPage() {
  const [data, setData] = useState<ActionsDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiGet<ActionsDTO>("/api/actions")
      .then((d) => {
        if (!alive) return;
        setData(d);
        setErr(null);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load actions");
        setData(null);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function runCta(cta: ActionsDTO["actions"][number]["cta"]) {
    if (cta.type === "open_url") {
      window.open(cta.url, "_blank", "noopener,noreferrer");
    }
    if (cta.type === "call_api") {
      try {
        await fetch(cta.path, {
          method: cta.method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: cta.body ? JSON.stringify(cta.body) : undefined,
        });
        // Refresh actions after API call
        const d = await apiGet<ActionsDTO>("/api/actions");
        setData(d);
      } catch (e) {
        console.error("Action failed:", e);
        // Optionally show error toast
      }
    }
    // verify_x: hook into your existing login flow later
  }

  return (
    <div style={{ minHeight: "100vh", padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ fontSize: 28, margin: 0 }}>Actions</h2>
        <div style={{ fontSize: 13, opacity: 0.75 }}>Quest board · state-driven</div>
      </header>

      {loading && (
        <Card title="Loading">
          <div style={{ opacity: 0.8 }}>Fetching actions…</div>
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
        <div style={{ display: "grid", gap: 16 }}>
          {data.system.notices.length > 0 && (
            <Card title="Notices">
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

          <Card title="Available Now">
            <div style={{ display: "grid", gap: 10 }}>
              {data.actions
                .filter((a) => a.state === "available")
                .map((a) => (
                  <ActionRow key={a.id} a={a} onRun={runCta} />
                ))}
              {data.actions.filter((a) => a.state === "available").length === 0 && (
                <div style={{ opacity: 0.8 }}>Nothing available right now.</div>
              )}
            </div>
          </Card>

          <Card title="Cooldown / Locked">
            <div style={{ display: "grid", gap: 10 }}>
              {data.actions
                .filter((a) => a.state !== "available")
                .map((a) => (
                  <ActionRow key={a.id} a={a} onRun={runCta} />
                ))}
              {data.actions.filter((a) => a.state !== "available").length === 0 && (
                <div style={{ opacity: 0.8 }}>All clear.</div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ActionRow({
  a,
  onRun,
}: {
  a: ActionsDTO["actions"][number];
  onRun: (cta: ActionsDTO["actions"][number]["cta"]) => Promise<void> | void;
}) {
  const disabled =
    a.cta.type === "disabled" || a.state === "locked" || a.state === "cooldown" || a.state === "completed";

  const meta =
    a.state === "cooldown" && a.cooldownEndsAt
      ? `Cooldown until ${new Date(a.cooldownEndsAt).toLocaleString()}`
      : a.state.toUpperCase();

  return (
    <div
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
          <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
            {a.rewardHint ? `Reward: ${a.rewardHint}` : "Reward: —"} · {meta}
            {a.progress ? ` · ${a.progress.current}/${a.progress.target}` : ""}
          </div>
        </div>

        <button
          disabled={disabled}
          onClick={() => onRun(a.cta)}
          style={{ padding: "8px 10px", borderRadius: 12, opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap" }}
        >
          {a.cta.label}
        </button>
      </div>
    </div>
  );
}

