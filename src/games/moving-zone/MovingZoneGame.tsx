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
  const timerRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const scoreRef = useRef(0);
  const lastTickRef = useRef(0);
  const cursorRef = useRef(0.5);

  function cleanup() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => cleanup, []);

  function updateCursor(clientX: number) {
    const element = areaRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
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
    setTargetX(0.5);
    cursorRef.current = 0.5;
    setCursorX(0.5);
    setTimeLeft(DURATION_MS);
    setPhase("RUNNING");

    timerRef.current = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - startRef.current;
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;

      const progress = elapsed / DURATION_MS;
      const target =
        0.5 + Math.sin(progress * Math.PI * 4) * 0.28 + Math.sin(progress * Math.PI * 9) * 0.08;
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

  const cursorLeft = `${cursorX * 100}%`;
  const targetLeft = `${targetX * 100}%`;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Moving Zone Hold</div>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Keep your pointer inside the moving green band. The start button sits on the cursor, already inside the band.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-50 px-4 py-3">
        <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Time left</div>
        <div className="mt-1 text-lg font-black text-slate-950">{Math.ceil(timeLeft / 1000)}s</div>
      </div>

      <div
        ref={areaRef}
        onPointerMove={(event) => phase === "RUNNING" && updateCursor(event.clientX)}
        onPointerDown={(event) => phase === "RUNNING" && updateCursor(event.clientX)}
        className="relative h-24 touch-none overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm sm:h-28 sm:rounded-[28px]"
      >
        <div className="absolute inset-x-5 top-1/2 h-3 -translate-y-1/2 rounded-full bg-slate-100" />
        <div
          className="absolute top-1/2 h-9 -translate-y-1/2 -translate-x-1/2 rounded-full bg-emerald-200/90 ring-2 ring-emerald-300 transition-all"
          style={{ left: targetLeft, width: `${BAND_WIDTH * 100}%` }}
        />
        <div
          className="absolute top-1/2 z-10 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950 shadow-lg ring-4 ring-white transition-all"
          style={{ left: cursorLeft }}
        />

        {phase === "IDLE" ? (
          <button
            type="button"
            onClick={begin}
            disabled={disabled}
            className="absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950 px-4 py-2 text-xs font-extrabold text-white shadow-lg transition hover:bg-slate-800 disabled:bg-slate-300"
            style={{ left: cursorLeft }}
          >
            Start
          </button>
        ) : null}
      </div>

      <p className="text-sm text-slate-600">Move across the lane and stay inside the green band.</p>

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
        {phase === "DONE" ? "Play again" : "Reset lane"}
      </button>
    </div>
  );
}
