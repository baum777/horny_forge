import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";

type BadgesDTO = {
  user: { status: "anonymous" | "verified" | "cooldown" | "rate_limited" };
  earned: Array<{
    id: string;
    name: string;
    icon: string; // e.g. "badge:signal" or URL later
    rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
    earnedAt: string;
    description?: string;
  }>;
  locked: Array<{
    id: string;
    name: string;
    icon: string;
    rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
    description?: string;
    progress?: { current: number; target: number };
    hints?: string[]; // short, non-technical
  }>;
  categories?: Array<{ id: string; name: string; badgeIds: string[] }>;
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

function BadgePill({ rarity }: { rarity?: BadgesDTO["earned"][number]["rarity"] }) {
  if (!rarity) return null;
  return (
    <span
      style={{
        fontSize: 11,
        padding: "4px 8px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        opacity: 0.9,
        marginLeft: 8,
      }}
    >
      {rarity.toUpperCase()}
    </span>
  );
}

export default function BadgesPage() {
  const [data, setData] = useState<BadgesDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"earned" | "locked">("earned");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiGet<BadgesDTO>("/api/badges")
      .then((d) => {
        if (!alive) return;
        setData(d);
        setErr(null);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load badges");
        setData(null);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const list = tab === "earned" ? data.earned : data.locked;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => b.name.toLowerCase().includes(q) || (b.description ?? "").toLowerCase().includes(q));
  }, [data, tab, query]);

  return (
    <div style={{ minHeight: "100vh", padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
        <h2 style={{ fontSize: 28, margin: 0 }}>Badges</h2>
        <div style={{ fontSize: 13, opacity: 0.75 }}>Collection · progress-first</div>
      </header>

      {loading && (
        <Card title="Loading">
          <div style={{ opacity: 0.8 }}>Fetching badges…</div>
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

          <Card title="Browse">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={() => setTab("earned")}
                style={{
                  padding: "8px 10px",
                  borderRadius: 12,
                  opacity: tab === "earned" ? 1 : 0.6,
                }}
              >
                Earned ({data.earned.length})
              </button>
              <button
                onClick={() => setTab("locked")}
                style={{
                  padding: "8px 10px",
                  borderRadius: 12,
                  opacity: tab === "locked" ? 1 : 0.6,
                }}
              >
                Locked ({data.locked.length})
              </button>

              <div style={{ flex: 1 }} />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search badges…"
                style={{
                  minWidth: 260,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.25)",
                  color: "inherit",
                }}
              />
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {filtered.map((b: any) => (
              <BadgeCard key={b.id} badge={b} locked={tab === "locked"} />
            ))}
          </div>

          {filtered.length === 0 && (
            <Card title="Empty">
              <div style={{ opacity: 0.8 }}>
                {tab === "earned" ? "No badges earned yet." : "No locked badges configured."}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function BadgeCard({ badge, locked }: { badge: any; locked: boolean }) {
  const progress = badge.progress as { current: number; target: number } | undefined;
  const pct = progress ? Math.max(0, Math.min(1, progress.current / Math.max(1, progress.target))) : 0;

  // Fallback icon if image fails to load
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/badges/v1/ui/unknown.svg";
  };

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 16,
        padding: 14,
        background: "rgba(255,255,255,0.04)",
        opacity: locked ? 0.85 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <img
          src={badge.icon}
          alt={badge.name}
          onError={handleImageError}
          style={{
            width: 48,
            height: 48,
            objectFit: "contain",
            opacity: locked ? 0.6 : 1,
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 16 }}>
              {badge.name}
              <BadgePill rarity={badge.rarity} />
            </div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{locked ? "LOCKED" : "EARNED"}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>{badge.description ?? "—"}</div>

      {!locked && badge.earnedAt && (
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          Earned: {new Date(badge.earnedAt).toLocaleString()}
        </div>
      )}

      {locked && (
        <div style={{ marginTop: 12 }}>
          {progress ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.75 }}>
                <span>Progress</span>
                <span>
                  {progress.current}/{progress.target}
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", marginTop: 8 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${pct * 100}%`,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.22)",
                  }}
                />
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.75 }}>Progress: —</div>
          )}

          {Array.isArray(badge.hints) && badge.hints.length > 0 && (
            <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
              {badge.hints.slice(0, 3).map((h: string, i: number) => (
                <div key={i} style={{ fontSize: 12, opacity: 0.75 }}>
                  • {h}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

