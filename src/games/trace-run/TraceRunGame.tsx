"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../types";

const DURATION_MS = 7000;

function clamp(value: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, value));
}

export default function TraceRunGame({ onFinish, disabled }: GameProps) {
  const [phase, setPhase] = useState<"IDLE" | "RUNNING" | "DONE">("IDLE");
  const [dot, setDot] = useState({ x: 0.5, y: 0.5 });
  const [cursor, setCursor] = useState({ x: 0.5, y: 0.5 });
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [score, setScore] = useState<number | null>(null);

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const padRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const lastTickRef = useRef(0);
  const scoreRef = useRef(0);
  const cursorRef = useRef({ x: 0.5, y: 0.5 });

  function cleanup() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => cleanup, []);

  function applyPoint(clientX: number, clientY: number, element: HTMLDivElement | null) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width);
    const y = clamp((clientY - rect.top) / rect.height);
    cursorRef.current = { x, y };
    setCursor({ x, y });
  }

  function begin() {
    if (disabled) return;

    cleanup();
    setScore(null);
    cursorRef.current = { x: 0.5, y: 0.5 };
    setCursor({ x: 0.5, y: 0.5 });
    setDot({ x: 0.5, y: 0.5 });
    setTimeLeft(DURATION_MS);
    startRef.current = performance.now();
    lastTickRef.current = startRef.current;
    scoreRef.current = 0;
    setPhase("RUNNING");

    timerRef.current = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - startRef.current;
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      const p = elapsed / DURATION_MS;
      const x = clamp(0.5 + Math.sin(p * Math.PI * 5.4) * 0.33 + Math.sin(p * Math.PI * 1.8) * 0.08, 0.08, 0.92);
      const y = clamp(0.5 + Math.cos(p * Math.PI * 4.2) * 0.28 + Math.sin(p * Math.PI * 3.1) * 0.12, 0.08, 0.92);
      setDot({ x, y });
      setTimeLeft(Math.max(0, DURATION_MS - elapsed));

      const dx = cursorRef.current.x - x;
      const dy = cursorRef.current.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      scoreRef.current += distance * dt * 7;

      if (elapsed >= DURATION_MS) {
        const finalScore = Math.round(scoreRef.current);
        setScore(finalScore);
        setPhase("DONE");
        onFinish({ scoreMs: finalScore, meta: { game: "trace-run", durationMs: DURATION_MS } });
        cleanup();
      }
    }, 16);
  }

  const cursorStyle = {
    left: `${cursor.x * 100}%`,
    top: `${cursor.y * 100}%`,
  };
  const dotStyle = {
    left: `${dot.x * 100}%`,
    top: `${dot.y * 100}%`,
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Trace Run</div>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Follow the moving marker as tightly as you can. On phones, use the lower touch pad so your finger does not block the arena.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-50 px-4 py-3">
        <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Time left</div>
        <div className="mt-1 text-lg font-black text-slate-950">{Math.ceil(timeLeft / 1000)}s</div>
      </div>

      <div
        ref={arenaRef}
        onPointerMove={(event) => phase === "RUNNING" && applyPoint(event.clientX, event.clientY, arenaRef.current)}
        onPointerDown={(event) => phase === "RUNNING" && applyPoint(event.clientX, event.clientY, arenaRef.current)}
        className="relative h-44 touch-none overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm sm:h-56 sm:rounded-[28px]"
      >
        <div
          className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/90 shadow-sm ring-4 ring-emerald-200 transition-all"
          style={dotStyle}
        />
        <div
          className="absolute z-10 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950 shadow-lg ring-4 ring-white transition-all"
          style={cursorStyle}
        />
        {phase === "IDLE" ? (
          <button
            type="button"
            onClick={begin}
            disabled={disabled}
            className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950 px-5 py-3 text-sm font-extrabold text-white shadow-lg transition hover:bg-slate-800 disabled:bg-slate-300"
          >
            Start trace run
          </button>
        ) : null}
      </div>

      <div
        ref={padRef}
        onPointerMove={(event) => phase === "RUNNING" && applyPoint(event.clientX, event.clientY, padRef.current)}
        onPointerDown={(event) => phase === "RUNNING" && applyPoint(event.clientX, event.clientY, padRef.current)}
        className="relative h-36 touch-none overflow-hidden rounded-[24px] border border-dashed border-slate-300 bg-slate-50 sm:hidden"
      >
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-medium text-slate-500">
          Touch pad for phone play
        </div>
        <div
          className="absolute z-10 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950/90 shadow-lg ring-4 ring-white transition-all"
          style={cursorStyle}
        />
      </div>

      {phase === "DONE" && score != null ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900">
          Run complete • Score {score}
        </div>
      ) : null}

      <button
        type="button"
        onClick={begin}
        disabled={disabled}
        className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
      >
        {phase === "DONE" ? "Play again" : "Reset trace run"}
      </button>
    </div>
  );
}
