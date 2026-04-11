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

type LocalServerChallenge = {
  answerId: string;
  clues: string[];
};

type RunStats = {
  levelsCleared: number;
  mistakes: number;
  totalElapsedMs: number;
  totalRevealCount: number;
  status: "RUNNING" | "FAILED" | "TIMED_OUT";
};

function buildLocalChallenge(level: number): { server: LocalServerChallenge; public: PublicChallenge } {
  const server = buildProgressiveRunChallenge("clue-ladder", level) as LocalServerChallenge;
  return {
    server,
    public: buildPublicProgressiveRunChallenge(server as any, 1) as PublicChallenge,
  };
}

function formatCountdown(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = safeMs / 1000;
  if (totalSeconds < 10) return `${totalSeconds.toFixed(1)}s`;
  const wholeSeconds = Math.ceil(totalSeconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = wholeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function NumberChainGame({
  onFinish,
  disabled,
  challenge: injectedChallenge,
}: GameProps<PublicChallenge>) {
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const initialLocal = useMemo(() => buildLocalChallenge(1), []);
  const [publicChallenge, setPublicChallenge] = useState<PublicChallenge>(injectedChallenge ?? initialLocal.public);
  const [localServerChallenge, setLocalServerChallenge] = useState<LocalServerChallenge>(initialLocal.server);
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
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
    setNowMs(Date.now());
    startedAtRef.current = null;
  }, [injectedChallenge]);

  useEffect(() => {
    if (phase !== "RUNNING") return;
    setNowMs(Date.now());
    const timer = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  const shownClues = publicChallenge.shownClues ?? [];
  const totalClues = publicChallenge.totalClues ?? shownClues.length;
  const level = publicChallenge.level ?? 1;
  const timeLimitMs = publicChallenge.timeLimitMs ?? 12000;
  const options = publicChallenge.options ?? [];
  const elapsedMs = phase === "RUNNING" && startedAtRef.current
    ? Math.max(0, nowMs - startedAtRef.current)
    : 0;
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
          setMessage(
            nextStats.status === "TIMED_OUT"
              ? "Time ran out. This competitive run is over."
              : "Wrong number. This competitive run is over.",
          );
          const preview = computeProgressiveRunScore(
            { ...nextStats, game: "clue-ladder" },
            nextStats.totalElapsedMs,
          );
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
        setMessage(`Correct. Level ${Number(data.nextChallenge?.level || level + 1)} begins with clue 1.`);
        startedAtRef.current = Date.now();
        setNowMs(Date.now());
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
      setMessage(timedOut ? "Time ran out. Practice run over." : "Wrong number. Practice run over.");
      const preview = computeProgressiveRunScore(
        { ...finalStats, game: "clue-ladder" },
        nextElapsed,
      );
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
    setMessage(`Correct. Level ${level + 1} begins with clue 1 already visible.`);
    startedAtRef.current = Date.now();
    setNowMs(Date.now());
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
    setMessage("Clue 1 is visible. Reveal more only if you need them.");
    setScore(null);
    startedAtRef.current = Date.now();
    setNowMs(Date.now());
  }

  async function revealNext() {
    if (disabled || pending || phase !== "RUNNING" || shownClues.length >= totalClues) return;

    if (!verifiedMode) {
      const nextShown = localServerChallenge.clues.slice(0, shownClues.length + 1);
      setPublicChallenge({ ...publicChallenge, shownClues: nextShown });
      setRunStats((prev) => ({ ...prev, totalRevealCount: prev.totalRevealCount + 1 }));
      setMessage(nextShown.length >= totalClues ? "All clues shown. Pick the next number." : "One more clue unlocked.");
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

      setPublicChallenge((prev) => ({ ...prev, shownClues: data.shownClues ?? [] }));
      setRunStats((prev) => ({ ...prev, totalRevealCount: prev.totalRevealCount + 1 }));
      setMessage(data.exhausted ? "All clues shown. Pick the next number." : "One more clue unlocked.");
    } catch (error: any) {
      setMessage(error?.message || "Could not reveal another clue.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900">Number Chain</h2>
          <p className="mt-1 text-sm text-slate-600">Spot the sequence, then choose the next number before time runs out.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
            <div className="text-slate-500">Clues</div>
            <div className="mt-1 font-bold text-slate-900">{shownClues.length}/{totalClues}</div>
          </div>
          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
            <div className="text-slate-500">Level</div>
            <div className="mt-1 font-bold text-slate-900">L{level}</div>
          </div>
          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
            <div className="text-slate-500">Cleared</div>
            <div className="mt-1 font-bold text-slate-900">{runStats.levelsCleared}</div>
          </div>
          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
            <div className="text-slate-500">Time left</div>
            <div className="mt-1 font-bold text-slate-900">{formatCountdown(remainingMs)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-slate-900 p-4 text-white">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Sequence clues</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {Array.from({ length: totalClues }, (_, index) => {
            const clue = shownClues[index];
            return (
              <div key={index} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Clue {index + 1}</div>
                <div className="mt-1 text-base font-bold text-white">{clue ? clue : `Locked clue ${index + 1}`}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={start}
          disabled={disabled || pending}
          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {phase === "READY" ? "Start run" : "Replay"}
        </button>
        <button
          type="button"
          onClick={() => void revealNext()}
          disabled={disabled || pending || phase !== "RUNNING" || shownClues.length >= totalClues}
          className="rounded-2xl bg-slate-900 px-3.5 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "Working..." : shownClues.length >= totalClues ? "All clues shown" : "Reveal next clue"}
        </button>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-sm font-semibold text-slate-700">Answer options</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => void resolveLevel(option.id, false)}
              disabled={disabled || pending || phase !== "RUNNING"}
              data-autofocus={index === 0 ? "true" : undefined}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="text-xl leading-none">{option.emoji}</div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Choose next number</div>
                  <div className="mt-1 text-base font-bold text-slate-900">{option.label}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 ring-1 ring-amber-200">
          {message}
        </div>
      ) : null}

      {score != null ? (
        <div className="mt-3 text-sm font-semibold text-slate-700">
          Run score <span className="text-slate-900">{score.toLocaleString("en-ZA")}</span>
        </div>
      ) : null}
    </section>
  );
}
