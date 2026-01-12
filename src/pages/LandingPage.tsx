import MemeBackground from "@/components/MemeBackground";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <MemeBackground count={9} spawnEveryMs={850} />

      <div style={{ position: "relative", zIndex: 10, padding: 24, maxWidth: 980, margin: "0 auto" }}>
        <h1 style={{ fontSize: 44, margin: "40px 0 10px" }}>$HORN​Y</h1>
        <p style={{ opacity: 0.85, fontSize: 18, lineHeight: 1.4, maxWidth: 720 }}>
          Participation over possession. Verify with X, earn badges, climb levels — rewards are transparent.
        </p>

        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          <button style={{ padding: "12px 16px", borderRadius: 12 }}>Verify with X</button>
          <Link to="/dashboard" style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)" }}>
            Open Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

