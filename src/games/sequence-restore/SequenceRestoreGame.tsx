"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

const TOKENS = ["Sun", "Drum", "Leaf", "Wave", "Spark", "Stone", "Cloud", "Bloom"];
const SHOW_MS = 2600;
const MAX_SCORE = 23000;

type RoundDef = {
  ordered: string[];
  shuffled: string[];
};

function shuffle<T>(values: readonly T[]) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function buildRound(): RoundDef {
  const ordered = shuffle(TOKENS).slice(0, 6);
  return {
    ordered,
    shuffled: shuffle(ordered),
  };
}

export default function SequenceRestoreGame({ onFinish, disabled }: GameProps) {
  const round = useMemo(() => buildRound(), []);
  const [phase, setPhase] = useState<"READY" | "SHOW" | "INPUT" | "DONE">("READY");
  const [bank, setBank] = useState<string[]>(round.shuffled);
  const [answer, setAnswer] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "SHOW") return undefined;
    const timer = window.setTimeout(() => {
      setPhase("INPUT");
      setMessage("Rebuild the strip in the same order.");
      startedAtRef.current = Date.now();
    }, SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function start() {
    if (disabled) return;
    setPhase("SHOW");
    setBank(round.shuffled);
    setAnswer([]);
    setScore(null);
    setMessage("Watch the full sequence carefully.");
    startedAtRef.current = null;
  }

  function takeToken(token: string) {
    if (disabled || phase !== "INPUT") return;
    setBank((current) => {
      const idx = current.indexOf(token);
      if (idx < 0) return current;
      const next = [...current];
      next.splice(idx, 1);
      return next;
    });
    setAnswer((current) => [...current, token]);
  }

  function undo() {
    if (disabled || phase !== "INPUT" || answer.length === 0) return;
    const token = answer[answer.length - 1]!;
    setAnswer((current) => current.slice(0, -1));
    setBank((current) => [...current, token]);
  }

  function submit() {
    if (disabled || phase !== "INPUT" || answer.length !== round.ordered.length) return;
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const correct = answer.every((token, index) => token === round.ordered[index]);
    const finalScore = correct ? Math.max(1200, MAX_SCORE - elapsedMs) : 0;

    setPhase("DONE");
    setScore(finalScore);
    setMessage(correct ? "Sequence restored." : "Order mismatch.");

    onFinish({
      scoreMs: finalScore,
      meta: {
        game: "sequence-restore",
        correct,
        elapsedMs,
        shownOrder: round.ordered,
        answer,
      },
    });
  }

  const preview = phase === "SHOW" ? round.ordered : answer;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-lg font-black text-slate-950">Sequence Restore</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">6-step strip</div>
      </div>

      <p className="mt-3 text-sm text-slate-600">Study the ordered strip, then rebuild it from the shuffled bank.</p>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {phase === "SHOW" ? "Preview" : "Your rebuild"}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: round.ordered.length }, (_, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-900">
              {preview[index] ?? "Empty"}
            </div>
          ))}
        </div>
      </div>

      {phase !== "SHOW" ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bank</div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {bank.map((token, index) => (
              <button
                key={`${token}-${index}`}
                type="button"
                onClick={() => takeToken(token)}
                disabled={disabled || phase !== "INPUT"}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {token}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {phase === "READY" ? "Start sequence restore" : "Restart"}
        </button>
        <button
          type="button"
          onClick={undo}
          disabled={disabled || phase !== "INPUT" || answer.length === 0}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={disabled || phase !== "INPUT" || answer.length !== round.ordered.length}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Submit order
        </button>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</div>
      ) : null}

      {score != null ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          Score {score.toLocaleString("en-ZA")}
        </div>
      ) : null}
    </div>
  );
}
