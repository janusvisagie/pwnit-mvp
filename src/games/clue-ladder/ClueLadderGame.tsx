"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";
import {
  buildProgressiveRunChallenge,
  buildPublicProgressiveRunChallenge,
  computeProgressiveRunScore,
} from "@/lib/competitiveRuns";

type Option = { id: string; label: string; emoji: string };

type PublicChallenge = {
  game?: "clue-ladder";
  level?: number;
  options?: Option[];
  shownClues?: string[];
  totalClues?: number;
  timeLimitMs?: number;
  attemptId?: string;
};

type RunStats = {
  levelsCleared: number;
  mistakes: number;
  totalElapsedMs: number;
  totalRevealCount: number;
  status: "RUNNING" | "FAILED" | "TIMED_OUT";
};

function buildLocalChallenge(level: number) {
  const server = buildProgressiveRunChallenge("clue-ladder", level);
  return {
    server,
    public: buildPublicProgressiveRunChallenge(server, 1) as PublicChallenge,
  };
}

function formatCountdown(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.ceil(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ClueLadderGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<PublicChallenge>) {
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const initialLocal = useMemo(() => buildLocalChallenge(1), []);
  const [publicChallenge, setPublicChallenge] = useState<PublicChallenge>(injectedChallenge ?? initialLocal.public);
  const [localServerChallenge, setLocalServerChallenge] = useState<any>(initialLocal.server);
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [runStats, setRunStats] = useState<RunStats>({
    levelsCleared: 0,
    mistakes: 0,
    totalElapsedMs: 0,
    totalRevealCount: publicChallenge.shownClues?.length ?? 1,
    status: "RUNNING",
  });
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!injectedChallenge) return;
    setPublicChallenge(injectedChallenge);
    setPhase("READY");
    setPending(false);
    setMessage(null);
    setScore(null);
    setRunStats({
      levelsCleared: 0,
      mistakes: 0,
      totalElapsedMs: 0,
      totalRevealCount: injectedChallenge.shownClues?.length ?? 1,
      status: "RUNNING",
    });
    startedAtRef.current = null;
  }, [injectedChallenge]);

  const shownClues = publicChallenge.shownClues ?? [];
  const totalClues = publicChallenge.totalClues ?? shownClues.length;
  const level = publicChallenge.level ?? 1;
  const timeLimitMs = publicChallenge.timeLimitMs ?? 12000;
  const options = publicChallenge.options ?? [];
  const elapsedMs = phase === "RUNNING" && startedAtRef.current ? Math.max(0, Date.now() - startedAtRef.current) : 0;
  const remainingMs = Math.max(0, timeLimitMs - elapsedMs);

  async function resolveLevel(selectedId: string | null, timedOut = false) {
    const levelElapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));

    if (verifiedMode) {
      setPending(true);
      try {
        const res = await fetch("/api/attempt/progress", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ attemptId: injectedChallenge?.attemptId, action: "resolve_level", selectedId, elapsedMs: levelElapsedMs, timedOut }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          setMessage(data?.error || `Could not continue (${res.status})`);
          return;
        }
        if (data.finished) {
          const nextStats: RunStats = {
            levelsCleared: Number(data.run?.levelsCleared || 0),
            mistakes: Number(data.run?.mistakes || 0),
            totalElapsedMs: Number(data.run?.totalElapsedMs || levelElapsedMs),
            totalRevealCount: Number(data.run?.totalRevealCount || 0),
            status: data.run?.status === "TIMED_OUT" ? "TIMED_OUT" : "FAILED",
          };
          setRunStats(nextStats);
          setPhase("DONE");
          setMessage(nextStats.status === "TIMED_OUT" ? "Time ran out. This competitive run is over." : "Wrong choice. This competitive run is over.");
          const preview = computeProgressiveRunScore({ ...nextStats, game: "clue-ladder" }, nextStats.totalElapsedMs);
          setScore(preview);
          onFinish({ scoreMs: preview, meta: { competitiveRun: true, game: "clue-ladder" } });
          return;
        }
        setPublicChallenge({ ...(data.nextChallenge || publicChallenge), attemptId: injectedChallenge?.attemptId });
        setRunStats({
          levelsCleared: Number(data.run?.levelsCleared || 0),
          mistakes: Number(data.run?.mistakes || 0),
          totalElapsedMs: Number(data.run?.totalElapsedMs || 0),
          totalRevealCount: Number(data.run?.totalRevealCount || 0),
          status: "RUNNING",
        });
        setMessage(`Level ${Number(data.nextChallenge?.level || level + 1)} ready. The first clue is already shown.`);
        startedAtRef.current = Date.now();
      } catch (error: any) {
        setMessage(error?.message || "Could not continue.");
      } finally {
        setPending(false);
      }
      return;
    }

    const success = !timedOut && selectedId === localServerChallenge.answerId;
    const nextElapsed = runStats.totalElapsedMs + levelElapsedMs;
    if (!success) {
      const finalStats: RunStats = {
        levelsCleared: runStats.levelsCleared,
        mistakes: runStats.mistakes + 1,
        totalElapsedMs: nextElapsed,
        totalRevealCount: runStats.totalRevealCount,
        status: timedOut ? "TIMED_OUT" : "FAILED",
      };
      setRunStats(finalStats);
      setPhase("DONE");
      setMessage(timedOut ? "Time ran out. Practice run over." : "Wrong choice. Practice run over.");
      const preview = computeProgressiveRunScore({ ...finalStats, game: "clue-ladder" }, nextElapsed);
      setScore(preview);
      onFinish({ scoreMs: preview, meta: { game: "clue-ladder", levelsCleared: finalStats.levelsCleared } });
      return;
    }

    const next = buildLocalChallenge(level + 1);
    setLocalServerChallenge(next.server);
    setPublicChallenge(next.public);
    setRunStats({
      levelsCleared: runStats.levelsCleared + 1,
      mistakes: runStats.mistakes,
      totalElapsedMs: nextElapsed,
      totalRevealCount: runStats.totalRevealCount + (next.public.shownClues?.length ?? 1),
      status: "RUNNING",
    });
    setMessage(`Correct. Level ${level + 1} begins with the first clue already shown.`);
    startedAtRef.current = Date.now();
  }

  useEffect(() => {
    if (phase !== "RUNNING" || pending || remainingMs > 0) return;
    void resolveLevel(null, true);
  }, [phase, pending, remainingMs]);

  function start() {
    if (disabled) return;
    const local = !verifiedMode ? buildLocalChallenge(1) : null;
    if (local) {
      setLocalServerChallenge(local.server);
      setPublicChallenge(local.public);
      setRunStats({
        levelsCleared: 0,
        mistakes: 0,
        totalElapsedMs: 0,
        totalRevealCount: local.public.shownClues?.length ?? 1,
        status: "RUNNING",
      });
    }
    setPhase("RUNNING");
    setMessage("The first clue is already shown. Reveal more only when needed, then pick the most likely prize.");
    setScore(null);
    startedAtRef.current = Date.now();
  }

  async function revealNext() {
    if (disabled || pending || phase !== "RUNNING" || shownClues.length >= totalClues) return;
    if (!verifiedMode) {
      const nextShown = localServerChallenge.clues.slice(0, shownClues.length + 1);
      setPublicChallenge({ ...publicChallenge, shownClues: nextShown });
      setRunStats((prev) => ({ ...prev, totalRevealCount: prev.totalRevealCount + 1 }));
      setMessage(nextShown.length >= totalClues ? "All clues unlocked. Lock in your answer." : "One more clue unlocked.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/attempt/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: injectedChallenge?.attemptId, action: "reveal" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMessage(data?.error || `Could not continue (${res.status})`);
        return;
      }
      setPublicChallenge((prev) => ({ ...prev, shownClues: data.shownClues }));
      setRunStats((prev) => ({ ...prev, totalRevealCount: prev.totalRevealCount + 1 }));
      setMessage(data.exhausted ? "All clues unlocked. Lock in your answer." : "One more clue unlocked.");
    } catch (error: any) {
      setMessage(error?.message || "Could not unlock another clue.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Clue Ladder</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          Clues {shownClues.length} / {totalClues}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Climb clue by clue, then choose the most likely prize from the answer panel. Every extra clue makes the choice easier but trims the score.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Run</div>
          <div className="mt-1 text-lg font-black text-slate-900">L{level}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Cleared</div>
          <div className="mt-1 text-lg font-black text-slate-900">{runStats.levelsCleared}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Time left</div>
          <div className="mt-1 text-lg font-black text-slate-900">{formatCountdown(remainingMs)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Scoring</div>
          <div className="mt-1 text-sm font-bold text-slate-900">Higher level, fewer clues, faster finish</div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {Array.from({ length: totalClues }, (_, index) => {
          const clue = shownClues[index];
          return (
            <div
              key={index}
              className={`rounded-2xl border px-4 py-3 text-sm ${clue ? "border-slate-200 bg-white text-slate-800 shadow-sm" : "border-dashed border-slate-200 bg-slate-50 text-slate-400"}`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Clue {index + 1}</div>
              <div className="mt-1">{clue ? clue : `Locked clue ${index + 1}`}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={start}
          disabled={disabled || pending || phase === "RUNNING"}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {phase === "READY" ? "Start run" : "Replay run"}
        </button>
        <button
          type="button"
          onClick={() => void revealNext()}
          disabled={disabled || pending || phase !== "RUNNING" || shownClues.length >= totalClues}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "Working..." : shownClues.length >= totalClues ? "All clues unlocked" : "Unlock next clue"}
        </button>
      </div>

      <div className="mt-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Available answer options</div>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => void resolveLevel(option.id, false)}
              disabled={disabled || pending || phase !== "RUNNING"}
              className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-900 shadow-sm">{option.emoji}</div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Answer option</div>
                  <div className="mt-1 text-sm font-black text-slate-950">{option.label}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {message ? <div className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</div> : null}
      {score != null ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          Run score {score.toLocaleString("en-ZA")}
        </div>
      ) : null}
    </div>
  );
}
