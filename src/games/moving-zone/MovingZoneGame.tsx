"use client";

import { useEffect, useRef, useState } from "react";

import type { GameProps } from "../types";

const DURATION_MS = 6500;

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
  const activePointerIdRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  function cleanup() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function stopDragging() {
    draggingRef.current = false;
    activePointerIdRef.current = null;
  }

  useEffect(() => cleanup, []);

  useEffect(() => {
    if (phase !== "RUNNING") return;

    const handleMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      if (activePointerIdRef.current != null && event.pointerId !== activePointerIdRef.current) return;
      updateCursor(event.clientX);
    };

    const handleUp = (event: PointerEvent) => {
      if (activePointerIdRef.current != null && event.pointerId !== activePointerIdRef.current) return;
      stopDragging();
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerup", handleUp, { passive: true });
    window.addEventListener("pointercancel", handleUp, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [phase]);

  function updateCursor(clientX: number) {
    const element = areaRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    cursorRef.current = x;
    setCursorX(x);
  }

  function begin(initialClientX?: number) {
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

    if (typeof initialClientX === "number") {
      updateCursor(initialClientX);
    }

    timerRef.current = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - startRef.current;
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;

      const progress = elapsed / DURATION_MS;
      const target = 0.5 + Math.sin(progress * Math.PI * 4) * 0.28 + Math.sin(progress * Math.PI * 9) * 0.08;
      const clampedTarget = Math.max(0.12, Math.min(0.88, target));

      setTargetX(clampedTarget);
      setTimeLeft(Math.max(0, DURATION_MS - elapsed));

      const distanceFromCentre = Math.abs(cursorRef.current - clampedTarget);
      scoreRef.current += distanceFromCentre * dt * 4.2;

      if (elapsed >= DURATION_MS) {
        const finalScore = Math.round(scoreRef.current);
        setScore(finalScore);
        setPhase("DONE");
        stopDragging();
        onFinish({ scoreMs: finalScore, meta: { game: "moving-zone", durationMs: DURATION_MS } });
        cleanup();
      }
    }, 16);
  }

  function reset() {
    cleanup();
    stopDragging();
    setPhase("IDLE");
    setScore(null);
    setTargetX(0.5);
    cursorRef.current = 0.5;
    setCursorX(0.5);
    setTimeLeft(DURATION_MS);
  }

  function handleBarPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    draggingRef.current = true;
    updateCursor(event.clientX);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // best effort
    }

    if (phase !== "RUNNING") {
      begin(event.clientX);
    }
  }

  function handleBarPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current != null && event.pointerId !== activePointerIdRef.current) return;
    stopDragging();
  }

  const cursorLeft = `${cursorX * 100}%`;
  const targetLeft = `${targetX * 100}%`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-slate-950">Moving Zone Hold</h2>
        <p className="mt-1 text-sm text-slate-600">
          Keep the black bar on the red marker inside the moving green band. Lower score wins.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          Time left {Math.ceil(timeLeft / 1000)}s
        </div>
        {phase === "IDLE" ? (
          <div className="text-sm font-medium text-slate-600">
            Tap and hold the black bar to start.
          </div>
        ) : null}
      </div>

      <div
        ref={areaRef}
        onPointerDown={handleBarPointerDown}
        onPointerMove={(event) => phase === "RUNNING" && updateCursor(event.clientX)}
        onPointerUp={handleBarPointerUp}
        className="relative h-24 touch-none overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm sm:h-28 sm:rounded-[28px]"
      >
        <div
          className="absolute inset-y-3 w-[18%] -translate-x-1/2 rounded-full bg-emerald-300/80 transition-all"
          style={{ left: targetLeft }}
        />
        <div
          className="absolute inset-y-0 w-1 -translate-x-1/2 bg-red-500 transition-all"
          style={{ left: targetLeft }}
        />
        <div
          className="absolute inset-y-2 w-5 -translate-x-1/2 rounded-full bg-slate-900 shadow"
          style={{ left: cursorLeft }}
        />
      </div>

      {phase === "DONE" && score != null ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Run complete • Score {score}
        </div>
      ) : null}

      {phase !== "IDLE" ? (
        <button
          type="button"
          onClick={reset}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50"
        >
          {phase === "DONE" ? "Play again" : "Reset"}
        </button>
      ) : null}
    </div>
  );
}
