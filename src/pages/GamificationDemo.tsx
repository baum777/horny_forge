import { GamificationPanel } from "../components/gamification/GamificationPanel";

export default function GamificationDemo() {
  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Gamification (Server-Truth)</h1>
        <p className="text-sm opacity-70">
          Client renders only server results. Server: http://localhost:3001
        </p>
      </div>
      <GamificationPanel />
    </div>
  );
}

