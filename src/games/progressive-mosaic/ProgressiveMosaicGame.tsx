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
  game?: "progressive-mosaic";
  level?: number;
  options?: Option[];
  shownReveals?: string[];
  maxReveals?: number;
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
  const server = buildProgressiveRunChallenge("progressive-mosaic", level);
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

export default function ProgressiveMosaicGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<PublicChallenge>) {
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const initialLocal = useMemo(() => buildLocalChallenge(1), []);
  const [publicChallenge, setPublicChallenge] = useState<PublicChallenge>(injectedChallenge ?? initialLocal.public);
  const [localServerChallenge, setLocalServerChallenge] = useState<any>(initialLocal.server);
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [runStats, setRunStats] = useState<RunStats>({
    levelsCleared: 0,
    mistakes: 0,
    totalElapsedMs: 0,
    totalRevealCount: publicChallenge.shownReveals?.length ?? 1,
    status: "RUNNING",
  });
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!injectedChallenge) return;
    setPublicChallenge(injectedChallenge);
    setRunStats({
      levelsCleared: 0,
      mistakes: 0,
      totalElapsedMs: 0,
      totalRevealCount: injectedChallenge.shownReveals?.length ?? 1,
      status: "RUNNING",
    });
    setPhase("READY");
    setMessage(null);
    setScore(null);
    setPending(false);
    startedAtRef.current = null;
  }, [injectedChallenge]);

  const shownReveals = publicChallenge.shownReveals ?? [];
  const maxReveals = publicChallenge.maxReveals ?? shownReveals.length;
  const timeLimitMs = publicChallenge.timeLimitMs ?? 12000;
  const level = publicChallenge.level ?? 1;
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
          body: JSON.stringify({
            attemptId: injectedChallenge?.attemptId,
            action: "resolve_level",
            selectedId,
            elapsedMs: levelElapsedMs,
            timedOut,
          }),
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
          setMessage(nextStats.status === "TIMED_OUT" ? "Time ran out. This competitive run is over." : "Wrong answer. This competitive run is over.");
          const preview = computeProgressiveRunScore({ ...nextStats, game: "progressive-mosaic" }, nextStats.totalElapsedMs);
          setScore(preview);
          onFinish({ scoreMs: preview, meta: { competitiveRun: true, game: "progressive-mosaic" } });
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
        setMessage(`Level ${Number(data.nextChallenge?.level || level + 1)} ready. The blurred target is already showing.`);
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
      setMessage(timedOut ? "Time ran out. Practice run over." : "Wrong answer. Practice run over.");
      const preview = computeProgressiveRunScore({ ...finalStats, game: "progressive-mosaic" }, nextElapsed);
      setScore(preview);
      onFinish({ scoreMs: preview, meta: { game: "progressive-mosaic", levelsCleared: finalStats.levelsCleared } });
      return;
    }

    const next = buildLocalChallenge(level + 1);
    setLocalServerChallenge(next.server);
    setPublicChallenge(next.public);
    setRunStats({
      levelsCleared: runStats.levelsCleared + 1,
      mistakes: runStats.mistakes,
      totalElapsedMs: nextElapsed,
      totalRevealCount: runStats.totalRevealCount + (next.public.shownReveals?.length ?? 1),
      status: "RUNNING",
    });
    setMessage(`Correct. Level ${level + 1} begins with the blurred first reveal already shown.`);
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
        totalRevealCount: local.public.shownReveals?.length ?? 1,
        status: "RUNNING",
      });
    }
    setPhase("RUNNING");
    setMessage("A blurred first glimpse is already showing. Sharpen the target only when needed, then choose the right prize.");
    setScore(null);
    startedAtRef.current = Date.now();
  }

  async function revealNext() {
    if (disabled || pending || phase !== "RUNNING" || shownReveals.length >= maxReveals) return;
    if (!verifiedMode) {
      const nextShown = localServerChallenge.reveals.slice(0, shownReveals.length + 1);
      setPublicChallenge({ ...publicChallenge, shownReveals: nextShown });
      setRunStats((prev) => ({ ...prev, totalRevealCount: prev.totalRevealCount + 1 }));
      setMessage(nextShown.length >= maxReveals ? "All reveal steps used. Make your choice." : "The target just became a little clearer.");
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
        setMessage(data?.error || `Could not reveal (${res.status})`);
        return;
      }
      setPublicChallenge((prev) => ({ ...prev, shownReveals: data.shownReveals }));
      setRunStats((prev) => ({ ...prev, totalRevealCount: prev.totalRevealCount + 1 }));
      setMessage(data.exhausted ? "All reveal steps used. Make your choice." : "The target just became a little clearer.");
    } catch (error: any) {
      setMessage(error?.message || "Could not reveal another step.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Progressive Mosaic</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          Reveals {shownReveals.length} / {maxReveals}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Start with a blurred target glimpse, sharpen it step by step, then guess the correct prize before you need too many reveal steps.
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
          <div className="mt-1 text-sm font-bold text-slate-900">Higher level, fewer reveals, faster finish</div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Target image coming into focus</div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: maxReveals }, (_, index) => {
            const tile = shownReveals[index];
            const blurred = tile && shownReveals.length <= 1 && index === 0;
            return (
              <div
                key={index}
                className="flex min-h-[78px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center text-sm font-bold text-slate-800 shadow-sm"
              >
                {tile ? <span className={blurred ? "blur-sm select-none" : ""}>{tile}</span> : <span className="text-xl text-slate-300">◾</span>}
              </div>
            );
          })}
        </div>
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
          disabled={disabled || pending || phase !== "RUNNING" || shownReveals.length >= maxReveals}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "Working..." : shownReveals.length >= maxReveals ? "All reveal steps used" : "Sharpen image"}
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
              className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white shadow-sm">{option.emoji}</div>
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
