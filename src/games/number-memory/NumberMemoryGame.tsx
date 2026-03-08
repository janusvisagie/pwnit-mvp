"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../types";

function randDigits(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

const INVALID_SCORE_SENTINEL = 2_000_000_000;

export default function NumberMemoryGame({ onFinish, disabled }: GameProps) {
  const DIGITS = 6;
  const SHOW_MS = 1500;
  const COUNTDOWN_FROM = 3;

  const [secret, setSecret] = useState<string | null>(null);
  const [phase, setPhase] = useState<"START" | "COUNTDOWN" | "SHOW" | "INPUT" | "DONE">("START");
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [lastTimeMs, setLastTimeMs] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const startedAt = useRef<number | null>(null);

  function begin() {
    if (disabled) return;
    setSecret(randDigits(DIGITS));
    setCount(COUNTDOWN_FROM);
    setValue("");
    setMsg(null);
    setLastTimeMs(null);
    startedAt.current = null;
    setPhase("COUNTDOWN");
  }

  function reset() {
    if (disabled) return;
    setSecret(null);
    setCount(COUNTDOWN_FROM);
    setValue("");
    setMsg(null);
    setLastTimeMs(null);
    startedAt.current = null;
    setPhase("START");
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

    if (guess !== secret) {
      setMsg("Not quite — try again.");
      setValue("");
      inputRef.current?.focus();
      onFinish({
        scoreMs: INVALID_SCORE_SENTINEL,
        meta: { valid: false, digits: DIGITS, showMs: SHOW_MS, timeTakenMs },
      });
      return;
    }

    setLastTimeMs(timeTakenMs);
    setMsg("Correct!");
    setPhase("DONE");
    onFinish({
      scoreMs: timeTakenMs,
      meta: { valid: true, digits: DIGITS, showMs: SHOW_MS, timeTakenMs },
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Objective</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">Memorise the 6-digit code, then enter it as fast as you can.</div>
        </div>
        <button
          onClick={reset}
          disabled={disabled}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
        >
          Reset round
        </button>
      </div>

      {phase === "START" ? (
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-center text-white shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Memory Sprint</div>
          <div className="mt-4 text-2xl font-black tracking-tight">Ready for a fresh code?</div>
          <div className="mt-2 text-sm text-slate-300">Press start when you’re ready. The countdown begins only after you choose to start.</div>
          <button
            onClick={begin}
            disabled={disabled}
            className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-900 transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            Start memory sprint
          </button>
        </div>
      ) : phase === "COUNTDOWN" ? (
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
                const next = e.target.value.replace(/[^\d]/g, "").slice(0, DIGITS);
                setValue(next);
                setMsg(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              inputMode="numeric"
              pattern="\d*"
              placeholder={`${DIGITS} digits`}
              disabled={disabled || phase !== "INPUT"}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-bold tracking-[0.28em] text-slate-900 outline-none ring-0 transition focus:border-slate-900"
            />
            <button
              onClick={submit}
              disabled={disabled || phase !== "INPUT"}
              className={[
                "shrink-0 rounded-2xl px-5 py-3 text-sm font-extrabold shadow-sm transition",
                disabled || phase !== "INPUT"
                  ? "bg-slate-200 text-slate-500"
                  : "bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800",
              ].join(" ")}
            >
              Enter
            </button>
          </div>

          {msg ? (
            <div className={["mt-3 text-sm font-semibold", msg === "Correct!" ? "text-emerald-700" : "text-slate-700"].join(" ")}>
              {msg}
            </div>
          ) : (
            <div className="mt-3 text-xs text-slate-500">Incorrect attempts still count toward activation.</div>
          )}

          {phase === "DONE" && lastTimeMs != null ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              Time: <span className="font-black text-emerald-900">{lastTimeMs}ms</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
