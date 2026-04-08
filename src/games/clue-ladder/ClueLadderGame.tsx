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

export default function ClueLadderGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<PublicChallenge>) {
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const initialLocal = useMemo(() => buildLocalChallenge(1), []);
  const [publicChallenge, setPublicChallenge] = useState<PublicChallenge>(injectedChallenge ?? initialLocal.public);
  const [localServerChallenge, setLocalServerChallenge] = useState<any>(initialLocal.server);
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [runStats, setRunStats] = useState<RunStats>({ levelsCleared: 0, mistakes: 0, totalElapsedMs: 0, totalRevealCount: publicChallenge.shownClues?.length ?? 1, status: "RUNNING" });
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (injectedChallenge) {
      setPublicChallenge(injectedChallenge);
      setPhase("READY");
      setPending(false);
      setMessage(null);
      setScore(null);
      setRunStats({ levelsCleared: 0, mistakes: 0, totalElapsedMs: 0, totalRevealCount: injectedChallenge.shownClues?.length ?? 1, status: "RUNNING" });
      startedAtRef.current = null;
    }
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
        setRunStats({ levelsCleared: Number(data.run?.levelsCleared || 0), mistakes: Number(data.run?.mistakes || 0), totalElapsedMs: Number(data.run?.totalElapsedMs || 0), totalRevealCount: Number(data.run?.totalRevealCount || 0), status: "RUNNING" });
        setMessage(`Level ${Number(data.nextChallenge?.level || level + 1)} ready. The first clue is already visible.`);
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
      const finalStats: RunStats = { levelsCleared: runStats.levelsCleared, mistakes: runStats.mistakes + 1, totalElapsedMs: nextElapsed, totalRevealCount: runStats.totalRevealCount, status: timedOut ? "TIMED_OUT" : "FAILED" };
      setRunStats(finalStats);
      setPhase("DONE");
      setMessage(timedOut ? "Time ran out. Practice run over." : "Wrong choice. Practice run over.");
      const preview = computeProgressiveRunScore({ ...finalStats, game: "clue-ladder" }, nextElapsed);
      setScore(preview);
      onFinish({ scoreMs: preview, meta: { game: "clue-ladder", levelsCleared: finalStats.levelsCleared } });
      return;
    }

    const next = buildLocalChallenge(level + 1);
    setLocalServerChallenge(next.server as any);
    setPublicChallenge(next.public);
    setRunStats({ levelsCleared: runStats.levelsCleared + 1, mistakes: runStats.mistakes, totalElapsedMs: nextElapsed, totalRevealCount: runStats.totalRevealCount + (next.public.shownClues?.length ?? 1), status: "RUNNING" });
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
      setLocalServerChallenge(local.server as any);
      setPublicChallenge(local.public);
      setRunStats({ levelsCleared: 0, mistakes: 0, totalElapsedMs: 0, totalRevealCount: local.public.shownClues?.length ?? 1, status: "RUNNING" });
    }
    setPhase("RUNNING");
    setMessage("The first clue is already visible. Reveal more only if you need it, then choose the best answer tile.");
    setScore(null);
    startedAtRef.current = Date.now();
  }

  async function revealNext() {
    if (disabled || pending || phase !== "RUNNING" || shownClues.length >= totalClues) return;
    if (!verifiedMode) {
      const nextShown = localServerChallenge.clues.slice(0, shownClues.length + 1);
      setPublicChallenge({ ...publicChallenge, shownClues: nextShown });
      setRunStats((prev) => ({ ...prev, totalRevealCount: prev.totalRevealCount + 1 }));
      setMessage(nextShown.length >= totalClues ? "All clues shown. Make your choice." : "Another clue is now visible.");
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
      setPublicChallenge((prev) => ({ ...prev, shownClues: data.shownClues }));
      setRunStats((prev) => ({ ...prev, totalRevealCount: prev.totalRevealCount + 1 }));
      setMessage(data.exhausted ? "All clues shown. Make your choice." : "Another clue is now visible.");
    } catch (error: any) {
      setMessage(error?.message || "Could not reveal another clue.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Clue Ladder</h3>
          <p className="mt-2 text-sm text-slate-600">Each level begins with the first clue already visible. Reveal more clues only when needed, then choose the correct answer tile.</p>
        </div>
        <div className="rounded-2xl bg-slate-900 px-3 py-2 text-right text-white">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Run</div>
          <div className="text-lg font-black">L{level}</div>
          <div className="text-xs text-slate-300">Cleared {runStats.levelsCleared}</div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Clues shown</div><div className="mt-1 text-lg font-black text-slate-900">{shownClues.length}/{totalClues}</div></div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Time left</div><div className="mt-1 text-lg font-black text-slate-900">{Math.ceil(remainingMs / 1000)}s</div></div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Scoring</div><div className="mt-1 text-sm font-bold text-slate-900">Higher level, fewer clues, faster finish</div></div>
      </div>

      <div className="mt-4 space-y-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        {Array.from({ length: totalClues }, (_, index) => {
          const clue = shownClues[index];
          return (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800">
              {clue ? clue : <span className="text-slate-300">Hidden clue</span>}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={start} disabled={disabled || pending || phase === "RUNNING"} className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-50">{phase === "READY" ? "Start run" : "Restart run"}</button>
        <button type="button" onClick={() => void revealNext()} disabled={disabled || pending || phase !== "RUNNING" || shownClues.length >= totalClues} className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{pending ? "Working..." : shownClues.length >= totalClues ? "All clues shown" : "Reveal clue"}</button>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Answer choices</div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {options.map((option) => (
            <button key={option.id} type="button" onClick={() => void resolveLevel(option.id, false)} disabled={disabled || pending || phase !== "RUNNING"} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 disabled:opacity-50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">{option.emoji}</div>
                <div className="text-sm font-black text-slate-950">{option.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {message ? <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</div> : null}
      {score != null ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">Run score {score.toLocaleString("en-ZA")}</div> : null}
    </div>
  );
}
