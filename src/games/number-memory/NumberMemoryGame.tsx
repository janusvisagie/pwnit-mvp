"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "../types";

const LEVEL_DIGITS = [3, 4, 5, 6, 7, 8];
const SHOW_MS = 1400;
const COUNTDOWN_FROM = 3;

type Phase = "READY" | "COUNTDOWN" | "SHOW" | "INPUT" | "DONE";

function randDigits(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export default function NumberMemoryGame({ onFinish, disabled }: GameProps) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [secret, setSecret] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("READY");
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const startedAt = useRef<number | null>(null);
  const totalScoreRef = useRef(0);

  const digits = useMemo(() => LEVEL_DIGITS[levelIndex] ?? LEVEL_DIGITS[LEVEL_DIGITS.length - 1], [levelIndex]);

  function beginLevel(nextLevel = 0) {
    if (disabled) return;
    const nextDigits = LEVEL_DIGITS[nextLevel] ?? LEVEL_DIGITS[LEVEL_DIGITS.length - 1];
    setLevelIndex(nextLevel);
    setSecret(randDigits(nextDigits));
    setCount(COUNTDOWN_FROM);
    setValue("");
    setMsg(null);
    setPhase("COUNTDOWN");
    startedAt.current = null;
  }

  function resetRun() {
    totalScoreRef.current = 0;
    setScore(null);
    setMsg(null);
    setValue("");
    setSecret(null);
    setLevelIndex(0);
    setCount(COUNTDOWN_FROM);
    setPhase("READY");
  }

  useEffect(() => {
    if (phase !== "COUNTDOWN") return;
    if (count <= 1) {
      const t = setTimeout(() => setPhase("SHOW"), 250);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount((c) => c - 1), 650);
    return () => clearTimeout(t);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "SHOW") return;
    const t = setTimeout(() => {
      setPhase("INPUT");
      startedAt.current = Date.now();
      setMsg(null);
      setValue("");
    }, SHOW_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "INPUT") return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => clearTimeout(t);
  }, [phase, levelIndex]);

  function finishRun(finalScore: number, finalMsg: string) {
    setScore(finalScore);
    setMsg(finalMsg);
    setPhase("DONE");
    onFinish({ scoreMs: finalScore, meta: { game: "memory-sprint", levels: LEVEL_DIGITS.length } });
  }

  function submit() {
    if (disabled || phase !== "INPUT" || !secret) return;
    const guess = value.trim();
    if (!guess) return;

    const end = Date.now();
    const start = startedAt.current ?? end;
    const timeTakenMs = Math.max(0, end - start);
    const correct = guess === secret;

    if (!correct) {
      const finalScore = totalScoreRef.current;
      finishRun(finalScore, `Not quite — the correct code was ${secret}.`);
      return;
    }

    const levelBase = (levelIndex + 1) * 10_000;
    const speedBonus = Math.max(0, 6_000 - timeTakenMs);
    totalScoreRef.current += levelBase + speedBonus;

    if (levelIndex >= LEVEL_DIGITS.length - 1) {
      finishRun(totalScoreRef.current, "Perfect run.");
      return;
    }

    setMsg("Correct — next code.");
    setPhase("DONE");
    setTimeout(() => beginLevel(levelIndex + 1), 650);
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">Objective</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">Memorise each code, then enter it as fast as you can across six levels.</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Level</div>
          <div className="mt-0.5 text-lg font-black tabular-nums text-slate-900">{Math.min(levelIndex + 1, LEVEL_DIGITS.length)} / {LEVEL_DIGITS.length}</div>
        </div>
      </div>

      {phase === "READY" ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 sm:text-[11px]">Memory Sprint</div>
          <div className="mt-2 text-sm leading-6 text-slate-700">A fresh code appears on every level. Memorise it, then type it back from memory to build your score.</div>
          <button onClick={() => beginLevel(0)} disabled={disabled} className={["mt-4 inline-flex min-h-[44px] items-center justify-center rounded-2xl px-5 py-3 text-sm font-extrabold shadow-sm transition", disabled ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800"].join(" ")}>
            Start memory sprint
          </button>
        </div>
      ) : phase === "COUNTDOWN" ? (
        <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-center text-white shadow-sm sm:rounded-[28px] sm:p-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 sm:text-[11px]">Get ready</div>
          <div className="mt-3 text-5xl font-black tabular-nums tracking-tight sm:text-6xl">{count}</div>
        </div>
      ) : phase === "SHOW" ? (
        <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-5 text-center shadow-sm sm:rounded-[28px] sm:p-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700 sm:text-[11px]">Memorise this</div>
          <div className="mt-3 text-3xl font-black tracking-[0.28em] text-slate-900 sm:text-5xl">{secret}</div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">Enter the code</div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => {
                const next = e.target.value.replace(/[^\d]/g, "").slice(0, digits);
                setValue(next);
                setMsg(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              autoFocus={phase === "INPUT"}
              inputMode="numeric"
              pattern="\d*"
              placeholder={`${digits} digits`}
              disabled={disabled || phase !== "INPUT"}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-bold tracking-[0.22em] text-slate-900 outline-none ring-0 transition focus:border-slate-900"
            />
            <button
              onClick={submit}
              disabled={disabled || phase !== "INPUT"}
              className={[
                "w-full shrink-0 rounded-2xl px-5 py-3 text-sm font-extrabold shadow-sm transition sm:w-auto",
                disabled || phase !== "INPUT" ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800",
              ].join(" ")}
            >
              Enter
            </button>
          </div>

          {msg ? (
            <div className={["mt-3 text-sm font-semibold", msg.includes("Perfect") || msg.startsWith("Correct") ? "text-emerald-700" : "text-slate-700"].join(" ")}>
              {msg}
            </div>
          ) : (
            <div className="mt-3 text-xs text-slate-500">Correct answers unlock the next code and add a bigger score bonus.</div>
          )}

          {phase === "DONE" && score != null ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              Score: <span className="font-black text-emerald-900">{score.toLocaleString("en-ZA")}</span>
            </div>
          ) : null}
        </div>
      )}

      <button onClick={resetRun} disabled={disabled} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50">
        Restart memory sprint
      </button>
    </div>
  );
}
