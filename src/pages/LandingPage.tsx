import SurfaceBackground from "@/components/SurfaceBackground";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { useCopy } from "@/lib/theme/copy";

export default function LandingPage() {
  const t = useCopy();
  return (
    <PageShell
      spec={{
        page: "landing",
        flavor: "default",
        energy: 1,
      }}
    >
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <SurfaceBackground count={9} spawnEveryMs={850} />

        <div style={{ position: "relative", zIndex: 10, padding: 24, maxWidth: 980, margin: "0 auto" }}>
          <h1 style={{ fontSize: 44, margin: "40px 0 10px" }}>{t('brand.wordmark')}</h1>
          <p style={{ opacity: 0.85, fontSize: 18, lineHeight: 1.4, maxWidth: 720 }}>
            {t('landing.hero.subtitle')}
          </p>

          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button style={{ padding: "12px 16px", borderRadius: 12 }}>{t('landing.hero.primary')}</button>
            <Link to="/dashboard" style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)" }}>
              {t('landing.hero.secondary')}
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

