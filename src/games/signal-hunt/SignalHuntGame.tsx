"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

type Challenge = {
  game?: "signal-hunt";
  targetPair?: [string, string];
  stream?: string[];
  symbolPool?: string[];
  maxSteps?: number;
  attemptId?: string;
};

const SYMBOL_POOL = ["▲", "●", "■", "◆", "✦"];
const MAX_STEPS = 12;
const MAX_SCORE = 24000;

function shuffle<T>(values: readonly T[]) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function randomChoice<T>(values: readonly T[]) {
  return values[Math.floor(Math.random() * values.length)]!;
}

function buildChallenge(): Challenge {
  const shuffled = shuffle(SYMBOL_POOL);
  const targetPair: [string, string] = [shuffled[0]!, shuffled[1]!];
  const triggerIndex = 4 + Math.floor(Math.random() * 4);
  const stream: string[] = [];
  while (stream.length < triggerIndex - 2) {
    const next = randomChoice(SYMBOL_POOL);
    const previous = stream[stream.length - 1] ?? null;
    if (previous === targetPair[0] && next === targetPair[1]) continue;
    stream.push(next);
  }
  stream.push(targetPair[0], targetPair[1]);
  while (stream.length < MAX_STEPS) {
    stream.push(randomChoice(SYMBOL_POOL));
  }
  return {
    game: "signal-hunt",
    targetPair,
    stream,
    symbolPool: SYMBOL_POOL,
    maxSteps: MAX_STEPS,
  };
}

function expectedCaptureAt(stream: string[], targetPair: [string, string]) {
  for (let i = 2; i <= stream.length; i += 1) {
    if (stream[i - 2] === targetPair[0] && stream[i - 1] === targetPair[1]) return i;
  }
  return null;
}

export default function SignalHuntGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const challenge = useMemo(() => injectedChallenge ?? buildChallenge(), [injectedChallenge]);
  const verifiedMode = Boolean(challenge.attemptId);
  const targetPair = challenge.targetPair ?? ["▲", "●"];
  const symbolPool = challenge.symbolPool ?? SYMBOL_POOL;
  const maxSteps = challenge.maxSteps ?? MAX_STEPS;

  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [revealed, setRevealed] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    setPhase("READY");
    setRevealed([]);
    setMessage(null);
    setScore(null);
    setPending(false);
    startedAtRef.current = null;
  }, [challenge.attemptId]);

  function start() {
    if (disabled) return;
    setPhase("RUNNING");
    setRevealed([]);
    setMessage(
      verifiedMode
        ? `Reveal the feed one signal at a time and capture the first time ${targetPair[0]} is followed immediately by ${targetPair[1]}.`
        : `Reveal the feed one signal at a time and capture the first time ${targetPair[0]} is followed immediately by ${targetPair[1]}.`,
    );
    setScore(null);
    setPending(false);
    startedAtRef.current = Date.now();
  }

  function finish(correct: boolean) {
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const provisionalScore = correct ? Math.max(1200, MAX_SCORE - elapsedMs - Math.max(0, revealed.length - 2) * 400) : 0;
    setPhase("DONE");
    setScore(provisionalScore);
    setMessage(
      verifiedMode
        ? "Run locked in. The server will verify whether you captured the first valid signal pair."
        : correct
          ? "Correct capture."
          : "Wrong or missed capture.",
    );
    onFinish({
      scoreMs: provisionalScore,
      meta: {
        game: "signal-hunt",
        elapsedMs,
        serverProgress: verifiedMode,
      },
    });
  }

  async function revealNext() {
    if (disabled || pending || phase !== "RUNNING" || revealed.length >= maxSteps) return;
    if (!verifiedMode) {
      const next = (challenge.stream ?? []).slice(0, revealed.length + 1);
      setRevealed(next);
      if (next.length >= maxSteps) {
        finish(false);
      } else {
        setMessage(`Signal ${next[next.length - 1]} received.`);
      }
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/attempt/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: challenge.attemptId, action: "next" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMessage(data?.error || `Could not reveal the next signal (${res.status})`);
        return;
      }
      const nextRevealed = Array.isArray(data.revealed) ? data.revealed.map((value: unknown) => String(value || "")) : [];
      setRevealed(nextRevealed);
      if (data.exhausted) {
        finish(false);
      } else {
        setMessage(`Signal ${String(data.currentSymbol || "") || "?"} received.`);
      }
    } catch (e: any) {
      setMessage(e?.message || "Could not reveal the next signal.");
    } finally {
      setPending(false);
    }
  }

  async function capture() {
    if (disabled || pending || phase !== "RUNNING" || revealed.length < 2) return;
    if (!verifiedMode) {
      const correct = expectedCaptureAt(challenge.stream ?? [], targetPair) === revealed.length;
      finish(Boolean(correct));
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/attempt/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: challenge.attemptId, action: "capture" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMessage(data?.error || `Could not capture the signal (${res.status})`);
        return;
      }
      const nextRevealed = Array.isArray(data.revealed) ? data.revealed.map((value: unknown) => String(value || "")) : revealed;
      setRevealed(nextRevealed);
      finish(true);
    } catch (e: any) {
      setMessage(e?.message || "Could not capture the signal.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Signal Hunt</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          Feed {revealed.length} / {maxSteps}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Reveal the live feed one symbol at a time. Capture the first time the target pair appears in sequence.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Target pair: <span className="font-black text-slate-800">{targetPair[0]} then {targetPair[1]}</span>
      </p>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live feed</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {revealed.length ? revealed.map((symbol, index) => (
            <span key={`${symbol}-${index}`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-lg font-black text-slate-900">
              {symbol}
            </span>
          )) : <span className="text-sm text-slate-400">No signals revealed yet.</span>}
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        Symbol pool: {symbolPool.join(" ")}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={start}
          disabled={disabled || pending || phase === "RUNNING"}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {phase === "READY" ? "Start Signal Hunt" : "Replay"}
        </button>
        <button
          type="button"
          onClick={() => void revealNext()}
          disabled={disabled || pending || phase !== "RUNNING" || revealed.length >= maxSteps}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? "Scanning..." : revealed.length >= maxSteps ? "Feed complete" : "Reveal next signal"}
        </button>
        <button
          type="button"
          onClick={() => void capture()}
          disabled={disabled || pending || phase !== "RUNNING" || revealed.length < 2}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Capture
        </button>
      </div>

      {message ? (
        <div className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</div>
      ) : null}

      {score != null ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          Score {score.toLocaleString("en-ZA")}
        </div>
      ) : null}
    </div>
  );
}
