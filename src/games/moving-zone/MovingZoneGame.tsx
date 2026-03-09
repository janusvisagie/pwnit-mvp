"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../types";

const DURATION_MS = 6500;
const BAND_WIDTH = 0.18;

export default function MovingZoneGame({ onFinish, disabled }: GameProps) {
  const [phase, setPhase] = useState<"IDLE" | "RUNNING" | "DONE">("IDLE");
  const [targetX, setTargetX] = useState(0.5);
  const [cursorX, setCursorX] = useState(0.5);
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [score, setScore] = useState<number | null>(null);

  const areaRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const scoreRef = useRef(0);
  const lastTickRef = useRef(0);
  const cursorRef = useRef(0.5);

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => cleanup, []);

  function updateCursor(clientX: number) {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    cursorRef.current = x;
    setCursorX(x);
  }

  function begin() {
    if (disabled) return;
    cleanup();
    startRef.current = performance.now();
    lastTickRef.current = startRef.current;
    scoreRef.current = 0;
    setScore(null);
    cursorRef.current = 0.5;
    setCursorX(0.5);
    setTargetX(0.5);
    setTimeLeft(DURATION_MS);
    setPhase("RUNNING");

    timerRef.current = setInterval(() => {
      const now = performance.now();
      const elapsed = now - startRef.current;
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;

      const progress = elapsed / DURATION_MS;
      const target = 0.5 + Math.sin(progress * Math.PI * 4) * 0.28 + Math.sin(progress * Math.PI * 9) * 0.08;
      const clampedTarget = Math.max(0.12, Math.min(0.88, target));
      setTargetX(clampedTarget);
      setTimeLeft(Math.max(0, DURATION_MS - elapsed));

      const distance = Math.abs(cursorRef.current - clampedTarget);
      const outside = Math.max(0, distance - BAND_WIDTH / 2);
      scoreRef.current += outside * dt * 3.5;

      if (elapsed >= DURATION_MS) {
        const finalScore = Math.round(scoreRef.current);
        setScore(finalScore);
        setPhase("DONE");
        onFinish({ scoreMs: finalScore, meta: { game: "moving-zone", durationMs: DURATION_MS } });
        cleanup();
      }
    }, 16);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Moving Zone Hold</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">Keep your pointer inside the moving band. The less you drift, the better your score.</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Time left</div>
          <div className="mt-1 text-xl font-black tabular-nums text-slate-900">{Math.ceil(timeLeft / 1000)}s</div>
        </div>
      </div>

      <div
        ref={areaRef}
        onPointerMove={(e) => phase === "RUNNING" && updateCursor(e.clientX)}
        onPointerDown={(e) => phase === "RUNNING" && updateCursor(e.clientX)}
        className="relative h-28 touch-none overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
      >
        <div className="absolute inset-y-0 w-[18%] -translate-x-1/2 rounded-2xl bg-emerald-100/90 ring-1 ring-emerald-300" style={{ left: `${targetX * 100}%` }} />
        <div className="absolute inset-y-4 w-3 -translate-x-1/2 rounded-full bg-slate-900 shadow-sm" style={{ left: `${cursorX * 100}%` }} />
        <div className="absolute inset-x-0 bottom-4 text-center text-[11px] font-semibold text-slate-500">Move across the lane and stay inside the green band</div>
      </div>

      {phase === "DONE" && score != null ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">Run complete • Score <span className="font-black text-slate-900">{score}</span></div>
      ) : null}

      <button
        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50"
        onClick={begin}
        disabled={!!disabled || phase === "RUNNING"}
      >
        {phase === "DONE" ? "Play again" : "Start moving zone"}
      </button>
    </div>
  );
}
