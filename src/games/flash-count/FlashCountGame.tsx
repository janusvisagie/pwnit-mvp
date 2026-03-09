"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "../types";

const COLORS = [
  { key: "red", label: "Red", cls: "bg-red-500" },
  { key: "blue", label: "Blue", cls: "bg-blue-500" },
  { key: "yellow", label: "Yellow", cls: "bg-yellow-400" },
  { key: "green", label: "Green", cls: "bg-green-500" },
] as const;

const ROUNDS = 4;
const FLASHES_PER_ROUND = 9;
const FLASH_MS = 340;
const GAP_MS = 120;
const INTRO_MS = 1100;
const BETWEEN_ROUNDS_MS = 550;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type RoundDef = {
  target: (typeof COLORS)[number];
  flashes: (typeof COLORS)[number][];
  answer: number;
};

function buildRound(): RoundDef {
  const target = COLORS[randInt(0, COLORS.length - 1)];
  const answer = randInt(1, 4);
  const others = COLORS.filter((c) => c.key !== target.key);
  const flashes: (typeof COLORS)[number][] = [];
  for (let i = 0; i < answer; i++) flashes.push(target);
  while (flashes.length < FLASHES_PER_ROUND) {
    flashes.push(others[randInt(0, others.length - 1)]);
  }
  for (let i = flashes.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [flashes[i], flashes[j]] = [flashes[j], flashes[i]];
  }
  return { target, flashes, answer };
}

export default function FlashCountGame({ onFinish, disabled }: GameProps) {
  const [phase, setPhase] = useState<"IDLE" | "INTRO" | "SHOW" | "INPUT" | "DONE">("IDLE");
  const [roundIndex, setRoundIndex] = useState(0);
  const [flashIndex, setFlashIndex] = useState(-1);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const roundsRef = useRef<RoundDef[]>([]);
  const totalRef = useRef(0);
  const shownAtRef = useRef(0);
  const mountedRef = useRef(true);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []);

  const current = roundsRef.current[roundIndex];
  const activeFlash = phase === "SHOW" && flashIndex >= 0 && current ? current.flashes[flashIndex] : null;

  function clearAllTimers() {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  }

  function queueTimeout(fn: () => void, delay: number) {
    const id = window.setTimeout(fn, delay);
    timeoutsRef.current.push(id);
    return id;
  }

  function startRun() {
    if (disabled) return;
    clearAllTimers();
    roundsRef.current = Array.from({ length: ROUNDS }, () => buildRound());
    totalRef.current = 0;
    setRoundIndex(0);
    setFlashIndex(-1);
    setSelected(null);
    setScore(null);
    setMessage(null);
    setPhase("INTRO");
  }

  useEffect(() => {
    if (phase !== "INTRO") return;
    if (!roundsRef.current[roundIndex]) return;
    clearAllTimers();
    queueTimeout(() => {
      if (!mountedRef.current) return;
      setPhase("SHOW");
    }, INTRO_MS);
    return () => clearAllTimers();
  }, [phase, roundIndex]);

  useEffect(() => {
    if (phase !== "SHOW") return;
    const round = roundsRef.current[roundIndex];
    if (!round) return;

    clearAllTimers();
    setFlashIndex(-1);

    const runFlash = (i: number) => {
      if (!mountedRef.current) return;
      if (i >= round.flashes.length) {
        setFlashIndex(-1);
        shownAtRef.current = Date.now();
        setPhase("INPUT");
        return;
      }

      setFlashIndex(i);
      queueTimeout(() => {
        if (!mountedRef.current) return;
        setFlashIndex(-1);
        queueTimeout(() => runFlash(i + 1), GAP_MS);
      }, FLASH_MS);
    };

    runFlash(0);
    return () => clearAllTimers();
  }, [phase, roundIndex]);

  const choices = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);

  function submitAnswer(value: number) {
    if (disabled || phase !== "INPUT") return;
    const round = roundsRef.current[roundIndex];
    if (!round) return;

    const elapsed = Math.max(0, Date.now() - shownAtRef.current);
    const correct = value === round.answer;
    const roundScore = correct ? Math.max(1200, 3500 - elapsed) : 0;
    totalRef.current += roundScore;
    setSelected(value);

    const nextRound = roundIndex + 1;
    if (nextRound >= ROUNDS) {
      const finalScore = totalRef.current;
      setScore(finalScore);
      setMessage(correct ? "Locked in." : `Missed it — there were ${round.answer}.`);
      setPhase("DONE");
      onFinish({ scoreMs: finalScore, meta: { game: "flash-count", rounds: ROUNDS } });
      return;
    }

    setMessage(correct ? "Correct." : `Not quite — there were ${round.answer}.`);
    clearAllTimers();
    queueTimeout(() => {
      if (!mountedRef.current) return;
      setMessage(null);
      setSelected(null);
      setRoundIndex(nextRound);
      setPhase("INTRO");
    }, BETWEEN_ROUNDS_MS);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Flash Count</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">Count the target colour as fast and accurately as you can.</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Round</div>
          <div className="mt-1 text-xl font-black tabular-nums text-slate-900">{Math.min(roundIndex + 1, ROUNDS)} / {ROUNDS}</div>
        </div>
      </div>

      {phase === "IDLE" ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Ready?</div>
          <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">Count the target colour you see</div>
          <div className="mt-3 text-sm text-slate-600">Watch the flashes, count the right colour, then answer quickly.</div>
          <button
            onClick={startRun}
            disabled={disabled}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50"
          >
            Start flash count
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
              <span>Target colour</span>
              <span>Higher score is better</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-2xl font-black text-slate-900">{current?.target.label}</div>
              <div className={`h-6 w-6 rounded-full ${current?.target.cls ?? "bg-slate-300"}`} />
            </div>
            <div className="mt-5 flex h-28 items-center justify-center rounded-[24px] bg-slate-50">
              {phase === "INTRO" ? (
                <div className="text-center">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Count this colour</div>
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <div className={`h-7 w-7 rounded-full ${current?.target.cls ?? "bg-slate-300"}`} />
                    <div className="text-2xl font-black text-slate-900">{current?.target.label}</div>
                  </div>
                </div>
              ) : activeFlash ? (
                <div className={`h-20 w-20 rounded-[22px] shadow-sm ${activeFlash.cls}`} />
              ) : (
                <div className="text-sm font-semibold text-slate-400">{phase === "SHOW" ? "Watch closely" : "How many did you see?"}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {choices.map((n) => (
              <button
                key={n}
                onClick={() => submitAnswer(n)}
                disabled={disabled || phase !== "INPUT"}
                className={[
                  "rounded-2xl px-4 py-3 text-base font-black shadow-sm transition",
                  phase !== "INPUT"
                    ? "bg-slate-100 text-slate-400"
                    : selected === n
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-900 ring-1 ring-slate-200 hover:-translate-y-0.5 hover:bg-slate-50",
                ].join(" ")}
              >
                {n}
              </button>
            ))}
          </div>

          {message ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{message}</div>
          ) : null}

          {phase === "DONE" && score != null ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">Run complete • Score <span className="font-black text-slate-900">{score}</span></div>
          ) : null}

          {phase === "DONE" ? (
            <button
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50"
              onClick={startRun}
              disabled={!!disabled}
            >
              Play again
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
