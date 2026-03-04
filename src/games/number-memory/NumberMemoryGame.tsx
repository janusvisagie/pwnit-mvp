// src/games/number-memory/NumberMemoryGame.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../types";

function randDigits(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

// Must stay within Prisma Int32
const INVALID_SCORE_SENTINEL = 2_000_000_000;

export default function NumberMemoryGame({ onFinish, disabled }: GameProps) {
  const DIGITS = 6;
  const SHOW_MS = 1500;
  const COUNTDOWN_FROM = 3;

  const [secret, setSecret] = useState<string | null>(null);
  const [phase, setPhase] = useState<"BOOT" | "COUNTDOWN" | "SHOW" | "INPUT" | "DONE">("BOOT");

  const [count, setCount] = useState(COUNTDOWN_FROM);
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [lastTimeMs, setLastTimeMs] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const startedAt = useRef<number | null>(null);

  function playAgain() {
    if (disabled) return;
    setSecret(null);
    setPhase("BOOT");
    setCount(COUNTDOWN_FROM);
    setValue("");
    setMsg(null);
    setLastTimeMs(null);
    startedAt.current = null;
  }

  // client-only secret to avoid hydration mismatch
  useEffect(() => {
    if (phase !== "BOOT") return;
    const s = randDigits(DIGITS);
    setSecret(s);
    setCount(COUNTDOWN_FROM);
    setPhase("COUNTDOWN");
  }, [phase]);

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

  // ✅ ensure cursor is in the input as soon as INPUT phase starts
  useEffect(() => {
    if (phase !== "INPUT") return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [phase]);

  function submit() {
    if (disabled) return;
    if (phase !== "INPUT") return;
    if (!secret) return;

    const guess = value.trim();
    if (!guess) return;

    const end = Date.now();
    const start = startedAt.current ?? end;
    const timeTakenMs = Math.max(0, end - start);

    if (guess !== secret) {
      // ✅ Incorrect STILL submits (counts toward activation + charges credits)
      setMsg("Not quite — try again.");
      setValue("");
      inputRef.current?.focus();

      onFinish({
        scoreMs: INVALID_SCORE_SENTINEL,
        meta: { valid: false, digits: DIGITS, showMs: SHOW_MS, timeTakenMs },
      });
      return;
    }

    // ✅ correct => eligible
    setLastTimeMs(timeTakenMs);
    setMsg("Correct!");
    setPhase("DONE");

    onFinish({
      scoreMs: timeTakenMs,
      meta: { valid: true, digits: DIGITS, showMs: SHOW_MS, timeTakenMs },
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">Number Memory</div>

        <button
          onClick={playAgain}
          disabled={disabled}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
        >
          Play Again
        </button>
      </div>

      {phase === "BOOT" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading…</div>
      ) : phase === "COUNTDOWN" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
          <div className="text-xs font-semibold text-slate-600">Get ready…</div>
          <div className="mt-2 text-4xl font-extrabold tabular-nums text-slate-900">{count}</div>
          <div className="mt-2 text-[11px] text-slate-500">(We do this so nobody feels “caught by surprise”.)</div>
        </div>
      ) : phase === "SHOW" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
          <div className="text-xs font-semibold text-slate-600">Memorize this:</div>
          <div className="mt-2 text-3xl font-extrabold tracking-widest tabular-nums text-slate-900">{secret}</div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-600">Enter the number:</div>

          <div className="mt-2 flex gap-2">
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
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10"
            />

            <button
              onClick={submit}
              disabled={disabled || phase !== "INPUT"}
              className={[
                "shrink-0 rounded-xl px-4 py-2 text-sm font-extrabold",
                disabled || phase !== "INPUT" ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800",
              ].join(" ")}
            >
              Enter
            </button>
          </div>

          {msg ? (
            <div className={["mt-2 text-xs font-semibold", msg === "Correct!" ? "text-emerald-700" : "text-slate-700"].join(" ")}>
              {msg}
            </div>
          ) : (
            <div className="mt-2 text-[11px] text-slate-500">
              Correct answers submit a leaderboard score. Incorrect attempts still count toward activation.
            </div>
          )}

          {phase === "DONE" && lastTimeMs != null ? (
            <div className="mt-3 text-xs font-semibold text-slate-700">
              Time: <span className="text-slate-900">{lastTimeMs}ms</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}