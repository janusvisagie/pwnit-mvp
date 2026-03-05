// src/components/ConfettiBurst.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Tiny, dependency-free confetti burst.
 * It renders only for a short time, then unmounts itself.
 */
export function ConfettiBurst({ durationMs = 2200 }: { durationMs?: number }) {
  const [alive, setAlive] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setAlive(false), durationMs);
    return () => window.clearTimeout(t);
  }, [durationMs]);

  const pieces = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const left = Math.round(Math.random() * 100);
      const delay = Math.random() * 200;
      const drift = (Math.random() - 0.5) * 40;
      const rot = Math.round(Math.random() * 360);
      const size = 6 + Math.round(Math.random() * 6);
      return { id: i, left, delay, drift, rot, size };
    });
  }, []);

  if (!alive) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-sm bg-slate-900 opacity-80"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            transform: `rotate(${p.rot}deg)`,
            animation: `pwnit-confetti-fall 1800ms ease-out ${p.delay}ms forwards`,
            ['--pwnit-drift' as any]: `${p.drift}px`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes pwnit-confetti-fall {
          0% {
            transform: translate3d(0, -20px, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--pwnit-drift), 110vh, 0) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default ConfettiBurst;
