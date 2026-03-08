"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function randDigits(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

const SHOW_BASE_MS = 900;
const COUNTDOWN_FROM = 3;
const LEVELS = [4, 5, 6, 7, 8];
const MAX_TIME_BONUS = 9000;

export default function NumberMemoryGame({ onFinish, disabled }: any) {
  const [phase, setPhase] = useState<"BOOT" | "COUNTDOWN" | "SHOW" | "INPUT" | "DONE">("BOOT");
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const [levelIndex, setLevelIndex] = useState(0);
  const [secret, setSecret] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [completedLevels, setCompletedLevels] = useState(0);
  const [bonusScore, setBonusScore] = useState(0);

  const startedAt = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const digits = LEVELS[levelIndex] ?? LEVELS[LEVELS.length - 1];
  const showMs = useMemo(() => SHOW_BASE_MS + digits * 180, [digits]);

  function playAgain() {
    if (disabled) return;
    setPhase("BOOT");
    setCount(COUNTDOWN_FROM);
    setLevelIndex(0);
    setSecret(null);
    setValue("");
    setMsg(null);
    setCompletedLevels(0);
    setBonusScore(0);
    startedAt.current = null;
  }

  function finalScore(levelsCleared: number, bonus: number) {
    return Math.max(0, levelsCleared * 10000 + Math.max(0, Math.floor(bonus)));
  }

  useEffect(() => {
    if (phase !== "BOOT") return;
    setSecret(randDigits(digits));
    setCount(COUNTDOWN_FROM);
    setPhase("COUNTDOWN");
  }, [phase, digits]);

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
    }, showMs);
    return () => clearTimeout(t);
  }, [phase, showMs]);

  useEffect(() => {
    if (phase !== "INPUT") return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [phase]);

  function submit() {
    if (disabled || phase !== "INPUT" || !secret) return;
    const guess = value.trim();
    if (!guess) return;

    const end = Date.now();
    const start = startedAt.current ?? end;
    const timeTakenMs = Math.max(0, end - start);
    const roundBonus = Math.max(0, MAX_TIME_BONUS - timeTakenMs - digits * 250);

    if (guess !== secret) {
      const score = finalScore(completedLevels, bonusScore);
      setMsg("Round over.");
      setPhase("DONE");
      onFinish({ scoreMs: score, meta: { valid: true, completedLevels, bonusScore, failedAtDigits: digits } });
      return;
    }

    const nextCompleted = completedLevels + 1;
    const nextBonus = bonusScore + roundBonus;
    setCompletedLevels(nextCompleted);
    setBonusScore(nextBonus);

    if (levelIndex >= LEVELS.length - 1) {
      const score = finalScore(nextCompleted, nextBonus);
      setMsg("Perfect run!");
      setPhase("DONE");
      onFinish({ scoreMs: score, meta: { valid: true, completedLevels: nextCompleted, bonusScore: nextBonus } });
      return;
    }

    setMsg("Correct — next level.");
    setLevelIndex((v) => v + 1);
    setPhase("BOOT");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Objective</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">Memorise each number string, level up, and finish quickly for a stronger score.</div>
        </div>
        <button
          onClick={playAgain}
          disabled={disabled}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
        >
          Reset round
        </button>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Level {levelIndex + 1}</span>
          <span>{digits} digits</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${((levelIndex + (phase === "DONE" ? 1 : 0)) / LEVELS.length) * 100}%` }} />
        </div>
      </div>

      {phase === "COUNTDOWN" ? (
        <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-center text-white shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Get ready</div>
          <div className="mt-4 text-6xl font-black tabular-nums tracking-tight">{count}</div>
        </div>
      ) : phase === "SHOW" ? (
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-6 text-center shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-700">Memorise this</div>
          <div className="mt-4 text-4xl font-black tracking-[0.35em] text-slate-900 sm:text-5xl">{secret}</div>
        </div>
      ) : (
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Enter the code</div>
          <div className="mt-3 flex gap-2">
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
              inputMode="numeric"
              pattern="\d*"
              placeholder={`${digits} digits`}
              disabled={disabled || phase !== "INPUT"}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-bold tracking-[0.28em] text-slate-900 outline-none ring-0 transition focus:border-slate-900"
            />
            <button
              onClick={submit}
              disabled={disabled || phase !== "INPUT"}
              className={[
                "shrink-0 rounded-2xl px-5 py-3 text-sm font-extrabold shadow-sm transition",
                disabled || phase !== "INPUT" ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800",
              ].join(" ")}
            >
              Enter
            </button>
          </div>

          {msg ? <div className="mt-3 text-sm font-semibold text-slate-700">{msg}</div> : <div className="mt-3 text-xs text-slate-500">The deeper you go, the bigger your score dispersion becomes.</div>}

          {phase === "DONE" ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              Final score: <span className="font-black text-emerald-900">Lvl {completedLevels} • {bonusScore.toLocaleString("en-ZA")} bonus</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
