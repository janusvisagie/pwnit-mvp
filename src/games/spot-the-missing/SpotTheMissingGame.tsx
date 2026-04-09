"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";
import {
  buildProgressiveRunChallenge,
  buildPublicProgressiveRunChallenge,
  computeProgressiveRunScore,
} from "@/lib/competitiveRuns";

type PublicChallenge = {
  game?: "spot-the-missing";
  level?: number;
  shown?: string[];
  remaining?: string[];
  options?: string[];
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

type DisplayPhase = "MEMORIZE" | "ANSWER";

const MEMORIZE_MS = 1400;

function buildLocalChallenge(level: number) {
  const server = buildProgressiveRunChallenge("spot-the-missing", level);
  return {
    server,
    public: buildPublicProgressiveRunChallenge(server, 0) as PublicChallenge,
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

export default function SpotTheMissingGame({
  onFinish,
  disabled,
  challenge: injectedChallenge,
}: GameProps<PublicChallenge>) {
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const initialLocal = useMemo(() => buildLocalChallenge(1), []);
  const [publicChallenge, setPublicChallenge] = useState<PublicChallenge>(
    injectedChallenge ?? initialLocal.public,
  );
  const [localServerChallenge, setLocalServerChallenge] = useState<any>(initialLocal.server);
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [displayPhase, setDisplayPhase] = useState<DisplayPhase>("MEMORIZE");
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [runStats, setRunStats] = useState<RunStats>({
    levelsCleared: 0,
    mistakes: 0,
    totalElapsedMs: 0,
    totalRevealCount: 0,
    status: "RUNNING",
  });
  const startedAtRef = useRef<number | null>(null);
  const memorizeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!injectedChallenge) return;
    setPublicChallenge(injectedChallenge);
    setPhase("READY");
    setDisplayPhase("MEMORIZE");
    setMessage(null);
    setScore(null);
    setPending(false);
    setNowMs(Date.now());
    setRunStats({
      levelsCleared: 0,
      mistakes: 0,
      totalElapsedMs: 0,
      totalRevealCount: 0,
      status: "RUNNING",
    });
    startedAtRef.current = null;
  }, [injectedChallenge]);

  useEffect(() => {
    if (phase !== "RUNNING") return;
    setNowMs(Date.now());
    const timer = window.setInterval(() => setNowMs(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (memorizeTimerRef.current) {
      window.clearTimeout(memorizeTimerRef.current);
      memorizeTimerRef.current = null;
    }

    if (phase !== "RUNNING") return;

    setDisplayPhase("MEMORIZE");
    memorizeTimerRef.current = window.setTimeout(() => {
      setDisplayPhase("ANSWER");
      memorizeTimerRef.current = null;
    }, MEMORIZE_MS);

    return () => {
      if (memorizeTimerRef.current) {
        window.clearTimeout(memorizeTimerRef.current);
        memorizeTimerRef.current = null;
      }
    };
  }, [phase, publicChallenge.level, publicChallenge.shown?.join("|"), publicChallenge.remaining?.join("|")]);

  const level = publicChallenge.level ?? 1;
  const shown = publicChallenge.shown ?? [];
  const remaining = publicChallenge.remaining ?? [];
  const options = publicChallenge.options ?? [];
  const timeLimitMs = publicChallenge.timeLimitMs ?? 9000;
  const elapsedMs =
    phase === "RUNNING" && startedAtRef.current ? Math.max(0, nowMs - startedAtRef.current) : 0;
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
          const finalStats: RunStats = {
            levelsCleared: Number(data.run?.levelsCleared || 0),
            mistakes: Number(data.run?.mistakes || 0),
            totalElapsedMs: Number(data.run?.totalElapsedMs || levelElapsedMs),
            totalRevealCount: 0,
            status: data.run?.status === "TIMED_OUT" ? "TIMED_OUT" : "FAILED",
          };
          setRunStats(finalStats);
          setPhase("DONE");
          setDisplayPhase("ANSWER");
          setMessage(
            finalStats.status === "TIMED_OUT"
              ? "Time ran out. This competitive run is over."
              : "Wrong answer. This competitive run is over.",
          );
          const preview = computeProgressiveRunScore(
            { ...finalStats, game: "spot-the-missing" },
            finalStats.totalElapsedMs,
          );
          setScore(preview);
          onFinish({ scoreMs: preview, meta: { competitiveRun: true, game: "spot-the-missing" } });
          return;
        }

        setPublicChallenge({
          ...(data.nextChallenge || publicChallenge),
          attemptId: injectedChallenge?.attemptId,
        });
        setRunStats({
          levelsCleared: Number(data.run?.levelsCleared || 0),
          mistakes: Number(data.run?.mistakes || 0),
          totalElapsedMs: Number(data.run?.totalElapsedMs || 0),
          totalRevealCount: 0,
          status: "RUNNING",
        });
        setMessage(`Correct. Level ${Number(data.nextChallenge?.level || level + 1)} is ready.`);
        startedAtRef.current = Date.now();
        setNowMs(Date.now());
        setDisplayPhase("MEMORIZE");
      } catch (error: any) {
        setMessage(error?.message || "Could not continue.");
      } finally {
        setPending(false);
      }
      return;
    }

    const success = !timedOut && selectedId === localServerChallenge.missing;
    const nextElapsed = runStats.totalElapsedMs + levelElapsedMs;
    if (!success) {
      const finalStats: RunStats = {
        levelsCleared: runStats.levelsCleared,
        mistakes: runStats.mistakes + 1,
        totalElapsedMs: nextElapsed,
        totalRevealCount: 0,
        status: timedOut ? "TIMED_OUT" : "FAILED",
      };
      setRunStats(finalStats);
      setPhase("DONE");
      setDisplayPhase("ANSWER");
      setMessage(timedOut ? "Time ran out. Practice run over." : "Wrong answer. Practice run over.");
      const preview = computeProgressiveRunScore(
        { ...finalStats, game: "spot-the-missing" },
        nextElapsed,
      );
      setScore(preview);
      onFinish({
        scoreMs: preview,
        meta: { game: "spot-the-missing", levelsCleared: finalStats.levelsCleared },
      });
      return;
    }

    const next = buildLocalChallenge(level + 1);
    setLocalServerChallenge(next.server);
    setPublicChallenge(next.public);
    setRunStats({
      levelsCleared: runStats.levelsCleared + 1,
      mistakes: runStats.mistakes,
      totalElapsedMs: nextElapsed,
      totalRevealCount: 0,
      status: "RUNNING",
    });
    setMessage(`Correct. Level ${level + 1} is ready.`);
    startedAtRef.current = Date.now();
    setNowMs(Date.now());
    setDisplayPhase("MEMORIZE");
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
        totalRevealCount: 0,
        status: "RUNNING",
      });
    }
    setPhase("RUNNING");
    setDisplayPhase("MEMORIZE");
    setMessage(
      "Memorise the full row first. After a short flash, choose the token that disappeared.",
    );
    setScore(null);
    startedAtRef.current = Date.now();
    setNowMs(Date.now());
  }

  const rowLabel = displayPhase === "MEMORIZE" ? "Memorise this row" : "One token is gone";
  const rowTokens = displayPhase === "MEMORIZE" ? shown : remaining;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Objective</div>
        <h3 className="mt-2 text-xl font-black text-slate-950">Spot the Missing</h3>
        <p className="mt-2 text-sm text-slate-600">
          Remember the full row, then identify which token disappeared after one is removed.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Level</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{level}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Cleared</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{runStats.levelsCleared}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Time left</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{formatCountdown(remainingMs)}</div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              {rowLabel}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {displayPhase === "MEMORIZE"
                ? "Lock the order into memory before the row changes."
                : "Now choose the token that disappeared."}
            </p>
          </div>
          <button
            type="button"
            onClick={start}
            disabled={disabled || pending || phase === "RUNNING"}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {phase === "READY" ? "Start run" : "Replay run"}
          </button>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-5 text-center text-2xl font-black tracking-wide text-slate-950 sm:text-3xl">
          {rowTokens.length ? rowTokens.join(" • ") : "Ready"}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Answer options</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => void resolveLevel(option, false)}
              disabled={disabled || pending || phase !== "RUNNING" || displayPhase !== "ANSWER"}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 disabled:opacity-50"
            >
              {option}
            </button>
          ))}
        </div>
        {phase === "RUNNING" && displayPhase === "MEMORIZE" ? (
          <p className="mt-3 text-sm font-semibold text-slate-500">Memorise first. Answer buttons unlock when the row changes.</p>
        ) : null}
      </div>

      {message ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          {message}
        </div>
      ) : null}

      {score != null ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-sm">
          Run score {score.toLocaleString("en-ZA")}
        </div>
      ) : null}
    </div>
  );
}
