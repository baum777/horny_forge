import React, { useEffect, useMemo, useRef, useState } from "react";

type FloatingItem = {
  id: string;
  src: string;
  x: number; // px (left)
  y: number; // px (top)
  w: number;      // px
  ar: number;     // aspect ratio
  z: number;
  op: number;
  dur: number;    // ms
  delay: number;  // ms
  s0: number;
  s1: number;
  s2: number;
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function randi(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}
function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function FloatingImages(props: {
  images: string[];
  maxOnScreen?: number;
  spawnEveryMs?: number;
  minDurationMs?: number;
  maxDurationMs?: number;
  minWidthPx?: number;
  maxWidthPx?: number;
  edgePaddingPx?: number;
  className?: string;
}) {
  const {
    images,
    maxOnScreen = 14,
    spawnEveryMs = 800,
    minDurationMs = 7000,
    maxDurationMs = 14000,
    minWidthPx = 80,
    maxWidthPx = 190,
    edgePaddingPx = 24,
    className = "",
  } = props;

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<FloatingItem[]>([]);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!images || images.length === 0) return;

    let interval: number | null = null;
    const timeouts = new Set<number>();

    const spawnOne = () => {
      const stage = stageRef.current;
      if (!stage) return;

      setItems((prev) => {
        if (prev.length >= maxOnScreen) return prev;

        const vw = stage.clientWidth || window.innerWidth;
        const vh = stage.clientHeight || window.innerHeight;

        // Größe + leicht variierende AR (für maximale Konsistenz: ar = 1)
        const w = rand(minWidthPx, Math.min(maxWidthPx, vw * 0.28));
        const ar = rand(0.9, 1.1);
        const h = w / ar;

        const x = rand(edgePaddingPx, Math.max(edgePaddingPx, vw - w - edgePaddingPx));
        const y = rand(edgePaddingPx, Math.max(edgePaddingPx, vh - h - edgePaddingPx));

        const dur = rand(minDurationMs, maxDurationMs);
        const delay = rand(0, 900);

        // Subtiler Look
        const item: FloatingItem = {
          id: uid(),
          src: pick(images),
          x,
          y,
          w,
          ar,
          z: randi(1, 50),
          op: rand(0.30, 0.55),
          dur,
          delay,
          s0: rand(0.85, 0.98),
          s1: rand(1.05, 1.18),
          s2: rand(0.90, 1.02),
        };

        const t = window.setTimeout(() => {
          setItems((cur) => cur.filter((x) => x.id !== item.id));
          timeouts.delete(t);
        }, dur + delay + 120);

        timeouts.add(t);

        return [...prev, item];
      });
    };

    // initial burst
    for (let i = 0; i < Math.min(6, maxOnScreen); i++) spawnOne();

    const startInterval = () => {
      if (interval) return;
      interval = window.setInterval(() => {
        // random: manchmal 0, manchmal 1–2 spawns
        const n = Math.random() < 0.25 ? 0 : Math.random() < 0.15 ? 2 : 1;
        for (let i = 0; i < n; i++) spawnOne();
      }, spawnEveryMs);
    };
    const stopInterval = () => {
      if (!interval) return;
      window.clearInterval(interval);
      interval = null;
    };
    startInterval();

    const onResize = () => {
      // reset für neue Positionen
      setItems([]);
    };
    window.addEventListener("resize", onResize);

    const onVis = () => {
      if (document.visibilityState === "hidden") stopInterval();
      else startInterval();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stopInterval();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      timeouts.forEach((t) => window.clearTimeout(t));
      timeouts.clear();
    };
  }, [
    prefersReducedMotion,
    images,
    maxOnScreen,
    spawnEveryMs,
    minDurationMs,
    maxDurationMs,
    minWidthPx,
    maxWidthPx,
    edgePaddingPx,
  ]);

  if (!images || images.length === 0) return null;

  return (
    <div
      ref={stageRef}
      className={[
        "pointer-events-none fixed inset-0 overflow-hidden z-0",
        className,
      ].join(" ")}
      aria-hidden="true"
    >
      <style>{`
        @keyframes float-breathe {
          0%   { opacity: 0; transform: scale(var(--s0)); }
          12%  { opacity: var(--op); }
          55%  { opacity: var(--op); transform: scale(var(--s1)); }
          88%  { opacity: var(--op); }
          100% { opacity: 0; transform: scale(var(--s2)); }
        }
      `}</style>

      {items.map((it) => (
        <div
          key={it.id}
          className="absolute will-change-transform"
          style={{
            left: it.x,
            top: it.y,
            width: `${it.w}px`,
            aspectRatio: `${it.ar}`,
            zIndex: it.z,
            '--op': `${it.op}`,
            '--s0': `${it.s0}`,
            '--s1': `${it.s1}`,
            '--s2': `${it.s2}`,
            opacity: 0,
            transform: `scale(${it.s0})`,
            transformOrigin: "center",
            animation: `float-breathe ${it.dur}ms cubic-bezier(.2,.8,.2,1) ${it.delay}ms 1 forwards`,
          } as React.CSSProperties & Record<`--${string}`, string>}
        >
          <img
            src={it.src}
            alt=""
            draggable={false}
            className="h-full w-full object-contain rounded-2xl opacity-90 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
          />
        </div>
      ))}
    </div>
  );
}
