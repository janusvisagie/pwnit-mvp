"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "../types";

function randDigits(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

const LEVELS = [4, 5, 6, 7, 8, 9] as const;
const COUNTDOWN_FROM = 3;

export default function NumberMemoryGame({ onFinish, disabled }: GameProps) {
  const [phase, setPhase] = useState<"IDLE" | "COUNTDOWN" | "SHOW" | "INPUT" | "DONE">("IDLE");
  const [levelIndex, setLevelIndex] = useState(0);
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const [secret, setSecret] = useState("");
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ completed: number; score: number } | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const levelStartedAt = useRef<number | null>(null);
  const totalTimeMs = useRef(0);

  const totalLevels = LEVELS.length;
  const digits = LEVELS[levelIndex] ?? LEVELS[LEVELS.length - 1];
  const showMs = useMemo(() => Math.max(900, 650 + digits * 170), [digits]);

  function resetRun() {
    if (disabled) return;
    setPhase("COUNTDOWN");
    setLevelIndex(0);
    setCount(COUNTDOWN_FROM);
    setSecret(randDigits(LEVELS[0]));
    setValue("");
    setMessage(null);
    setSummary(null);
    totalTimeMs.current = 0;
    levelStartedAt.current = null;
  }

  function finishRun(completedLevels: number, failed: boolean) {
    const score = (totalLevels - completedLevels) * 100_000 + totalTimeMs.current + (failed ? 2_500 : 0);
    setSummary({ completed: completedLevels, score });
    setPhase("DONE");
    onFinish({
      scoreMs: score,
      meta: {
        game: "memory-sprint",
        completedLevels,
        totalLevels,
        totalTimeMs: totalTimeMs.current,
        failed,
      },
    });
  }

  useEffect(() => {
    if (phase !== "COUNTDOWN") return;
    if (count <= 1) {
      const t = setTimeout(() => setPhase("SHOW"), 260);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount((c) => c - 1), 650);
    return () => clearTimeout(t);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "SHOW") return;
    const t = setTimeout(() => {
      setPhase("INPUT");
      setValue("");
      setMessage(null);
      levelStartedAt.current = Date.now();
      inputRef.current?.focus();
    }, showMs);
    return () => clearTimeout(t);
  }, [phase, showMs]);

  function submitGuess() {
    if (disabled || phase !== "INPUT" || !secret) return;
    const guess = value.trim();
    if (!guess) return;

    const elapsed = Math.max(0, Date.now() - (levelStartedAt.current ?? Date.now()));
    totalTimeMs.current += elapsed;

    if (guess !== secret) {
      setMessage("Not quite — run ended.");
      finishRun(levelIndex, true);
      return;
    }

    const completed = levelIndex + 1;
    if (completed >= totalLevels) {
      setMessage("Perfect run.");
      finishRun(completed, false);
      return;
    }

    const nextIndex = levelIndex + 1;
    setMessage(`Locked in level ${completed}.`);
    setLevelIndex(nextIndex);
    setSecret(randDigits(LEVELS[nextIndex]));
    setCount(COUNTDOWN_FROM);
    setPhase("COUNTDOWN");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Memory Sprint</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">
            Climb through longer and longer codes. Higher completed levels beat faster but shorter runs.
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Level</div>
          <div className="mt-1 text-xl font-black tabular-nums text-slate-900">
            {Math.min(levelIndex + (phase === "DONE" && summary ? summary.completed : 1), totalLevels)} / {totalLevels}
          </div>
        </div>
      </div>

      {phase === "IDLE" ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Ready?</div>
          <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">Start a fresh memory sprint</div>
          <div className="mt-3 text-sm text-slate-600">Memorise the code, enter it, then survive the next level.</div>
          <button
            onClick={resetRun}
            disabled={disabled}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50"
          >
            Start memory sprint
          </button>
        </div>
      ) : phase === "COUNTDOWN" ? (
        <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-center text-white shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Next code incoming</div>
          <div className="mt-4 text-6xl font-black tabular-nums tracking-tight">{count}</div>
        </div>
      ) : phase === "SHOW" ? (
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-6 text-center shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-indigo-700">Memorise this</div>
          <div className="mt-4 text-4xl font-black tracking-[0.35em] text-slate-900 sm:text-5xl">{secret}</div>
        </div>
      ) : (
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
            <span>Enter the {digits}-digit code</span>
            <span>Total levels cleared: {summary?.completed ?? levelIndex}</span>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, "").slice(0, digits))}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitGuess();
              }}
              inputMode="numeric"
              pattern="\d*"
              placeholder={`${digits} digits`}
              disabled={disabled || phase !== "INPUT"}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-bold tracking-[0.28em] text-slate-900 outline-none transition focus:border-slate-900"
            />
            <button
              onClick={submitGuess}
              disabled={disabled || phase !== "INPUT"}
              className={["shrink-0 rounded-2xl px-5 py-3 text-sm font-extrabold shadow-sm transition", disabled || phase !== "INPUT" ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800"].join(" ")}
            >
              Enter
            </button>
          </div>

          {message ? <div className="mt-3 text-sm font-semibold text-slate-700">{message}</div> : null}

          {phase === "DONE" && summary ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Cleared <span className="font-black text-slate-900">{summary.completed}</span> levels • Score <span className="font-black text-slate-900">{summary.score}</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
