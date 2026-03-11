"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "../types";

const LEVEL_DIGITS = [3, 4, 5, 6, 7, 8];
const SHOW_MS = 1400;
const COUNTDOWN_FROM = 3;

type Phase = "READY" | "COUNTDOWN" | "SHOW" | "INPUT" | "DONE";

function randDigits(len: number) {
  let s = "";
  for (let i = 0; i < len; i += 1) s += Math.floor(Math.random() * 10);
  return s;
}

export default function NumberMemoryGame({ onFinish, disabled }: GameProps) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [secret, setSecret] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("READY");
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const totalScoreRef = useRef(0);

  const digits = useMemo(
    () => LEVEL_DIGITS[levelIndex] ?? LEVEL_DIGITS[LEVEL_DIGITS.length - 1],
    [levelIndex],
  );

  function beginLevel(nextLevel = 0) {
    if (disabled) return;
    const nextDigits = LEVEL_DIGITS[nextLevel] ?? LEVEL_DIGITS[LEVEL_DIGITS.length - 1];
    setLevelIndex(nextLevel);
    setSecret(randDigits(nextDigits));
    setCount(COUNTDOWN_FROM);
    setValue("");
    setMessage(null);
    startedAtRef.current = null;
    setPhase("COUNTDOWN");
  }

  function resetRun() {
    totalScoreRef.current = 0;
    setScore(null);
    setMessage(null);
    setValue("");
    setSecret(null);
    setLevelIndex(0);
    setCount(COUNTDOWN_FROM);
    startedAtRef.current = null;
    setPhase("READY");
  }

  useEffect(() => {
    if (phase !== "COUNTDOWN") return;

    if (count <= 1) {
      const timer = window.setTimeout(() => setPhase("SHOW"), 250);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => setCount((current) => current - 1), 650);
    return () => window.clearTimeout(timer);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "SHOW") return;

    const timer = window.setTimeout(() => {
      setPhase("INPUT");
      startedAtRef.current = Date.now();
      setValue("");
      setMessage(null);
    }, SHOW_MS);

    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "INPUT") return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [phase, levelIndex]);

  function finishRun(finalScore: number, finalMessage: string) {
    setScore(finalScore);
    setMessage(finalMessage);
    setPhase("DONE");
    onFinish({
      scoreMs: finalScore,
      meta: { game: "memory-sprint", levels: LEVEL_DIGITS.length },
    });
  }

  function submit() {
    if (disabled || phase !== "INPUT" || !secret) return;

    const guess = value.trim();
    if (!guess) return;

    const endedAt = Date.now();
    const startedAt = startedAtRef.current ?? endedAt;
    const timeTakenMs = Math.max(0, endedAt - startedAt);

    if (guess !== secret) {
      finishRun(totalScoreRef.current, `Not quite — the correct code was ${secret}.`);
      return;
    }

    const levelBase = (levelIndex + 1) * 10_000;
    const speedBonus = Math.max(0, 6_000 - timeTakenMs);
    totalScoreRef.current += levelBase + speedBonus;

    if (levelIndex >= LEVEL_DIGITS.length - 1) {
      finishRun(totalScoreRef.current, "Perfect run.");
      return;
    }

    setMessage("Correct — next code.");
    setPhase("DONE");
    window.setTimeout(() => beginLevel(levelIndex + 1), 650);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Objective</div>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Memorise each code, then enter it as fast as you can across six rounds.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-50 px-4 py-3">
        <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Level</div>
        <div className="mt-1 text-lg font-black text-slate-950">
          {Math.min(levelIndex + 1, LEVEL_DIGITS.length)} / {LEVEL_DIGITS.length}
        </div>
      </div>

      {phase === "READY" ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black text-slate-950">Memory Sprint</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            A fresh code appears on every round. The countdown only starts after you press Start.
          </p>
          <button
            type="button"
            onClick={() => beginLevel(0)}
            disabled={disabled}
            className={[
              "mt-4 inline-flex min-h-[44px] items-center justify-center rounded-2xl px-5 py-3 text-sm font-extrabold shadow-sm transition",
              disabled ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800",
            ].join(" ")}
          >
            Start memory sprint
          </button>
        </div>
      ) : phase === "COUNTDOWN" ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Get ready</div>
          <div className="mt-3 text-6xl font-black tracking-tight text-slate-950">{count}</div>
        </div>
      ) : phase === "SHOW" ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Memorise this</div>
          <div className="mt-4 text-4xl font-black tracking-[0.28em] text-slate-950">{secret}</div>
        </div>
      ) : (
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Enter the code</div>
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => {
              const next = event.target.value.replace(/[^\d]/g, "").slice(0, digits);
              setValue(next);
              setMessage(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            autoFocus={phase === "INPUT"}
            inputMode="numeric"
            pattern="\d*"
            placeholder={`${digits} digits`}
            disabled={disabled || phase !== "INPUT"}
            className="mt-3 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-bold tracking-[0.22em] text-slate-900 outline-none transition focus:border-slate-900"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={disabled || phase !== "INPUT"}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500"
            >
              Enter
            </button>
            <button
              type="button"
              onClick={resetRun}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Restart memory sprint
            </button>
          </div>

          {message ? (
            <p className="mt-3 text-sm font-semibold text-slate-700">{message}</p>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Each correct answer unlocks the next code and adds a bigger score bonus.
            </p>
          )}

          {phase === "DONE" && score != null ? (
            <div className="mt-3 text-sm font-bold text-slate-900">
              Score: {score.toLocaleString("en-ZA")}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
