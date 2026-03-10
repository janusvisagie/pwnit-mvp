"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../types";

const DURATION_MS = 7000;

function clamp(v: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}

export default function TraceRunGame({ onFinish, disabled }: GameProps) {
  const [phase, setPhase] = useState<"IDLE" | "RUNNING" | "DONE">("IDLE");
  const [dot, setDot] = useState({ x: 0.5, y: 0.5 });
  const [cursor, setCursor] = useState({ x: 0.5, y: 0.5 });
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [score, setScore] = useState<number | null>(null);

  const areaRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const lastTickRef = useRef(0);
  const scoreRef = useRef(0);
  const cursorRef = useRef({ x: 0.5, y: 0.5 });

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => cleanup, []);

  function updateCursor(clientX: number, clientY: number) {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
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
    startRef.current = performance.now();
    lastTickRef.current = startRef.current;
    scoreRef.current = 0;
    setPhase("RUNNING");

    timerRef.current = setInterval(() => {
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

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">Trace Run</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">Follow the moving marker as tightly as you can. Smaller drift wins.</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Time left</div>
          <div className="mt-0.5 text-lg font-black tabular-nums text-slate-900">{Math.ceil(timeLeft / 1000)}s</div>
        </div>
      </div>

      <div
        ref={areaRef}
        onPointerMove={(e) => phase === "RUNNING" && updateCursor(e.clientX, e.clientY)}
        onPointerDown={(e) => phase === "RUNNING" && updateCursor(e.clientX, e.clientY)}
        className="relative h-44 touch-none overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm sm:h-56 sm:rounded-[28px]"
      >
        <div
          className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 shadow-lg sm:h-7 sm:w-7"
          style={{ left: `${dot.x * 100}%`, top: `${dot.y * 100}%` }}
        />
        <div
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900/85 ring-4 ring-slate-900/10"
          style={{ left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%` }}
        />
        <div className="absolute inset-x-0 bottom-3 px-3 text-center text-[10px] font-semibold text-slate-500 sm:text-[11px]">Keep your pointer glued to the green marker</div>
      </div>

      {phase === "DONE" && score != null ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">Run complete • Score <span className="font-black text-slate-900">{score}</span></div>
      ) : null}

      <button
        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50"
        onClick={begin}
        disabled={!!disabled || phase === "RUNNING"}
      >
        {phase === "DONE" ? "Play again" : "Start trace run"}
      </button>
    </div>
  );
}
