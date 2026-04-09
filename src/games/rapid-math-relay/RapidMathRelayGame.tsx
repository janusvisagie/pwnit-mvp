"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";
import {
  buildProgressiveRunChallenge,
  buildPublicProgressiveRunChallenge,
  computeProgressiveRunScore,
} from "@/lib/competitiveRuns";

type PublicChallenge = {
  game?: "rapid-math-relay";
  level?: number;
  prompt?: string;
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
  const server = buildProgressiveRunChallenge("rapid-math-relay", level);
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

export default function RapidMathRelayGame({
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
  const [draft, setDraft] = useState("");
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

  useEffect(() => {
    if (!injectedChallenge) return;
    setPublicChallenge(injectedChallenge);
    setPhase("READY");
    setDraft("");
    setMessage(null);
    setScore(null);
    setPending(false);
    setRunStats({
      levelsCleared: 0,
      mistakes: 0,
      totalElapsedMs: 0,
      totalRevealCount: 0,
      status: "RUNNING",
    });
    setNowMs(Date.now());
    startedAtRef.current = null;
  }, [injectedChallenge]);

  useEffect(() => {
    if (phase !== "RUNNING") return;
    setNowMs(Date.now());
    const timer = window.setInterval(() => setNowMs(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [phase]);

  const level = publicChallenge.level ?? 1;
  const prompt = publicChallenge.prompt ?? "?";
  const timeLimitMs = publicChallenge.timeLimitMs ?? 8000;
  const elapsedMs =
    phase === "RUNNING" && startedAtRef.current ? Math.max(0, nowMs - startedAtRef.current) : 0;
  const remainingMs = Math.max(0, timeLimitMs - elapsedMs);

  async function resolveLevel(timedOut = false) {
    const elapsedForLevel = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const answerValue = timedOut ? null : Number(draft);

    if (verifiedMode) {
      setPending(true);
      try {
        const res = await fetch("/api/attempt/progress", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            attemptId: injectedChallenge?.attemptId,
            action: "resolve_level",
            answer: answerValue,
            elapsedMs: elapsedForLevel,
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
            totalElapsedMs: Number(data.run?.totalElapsedMs || elapsedForLevel),
            totalRevealCount: 0,
            status: data.run?.status === "TIMED_OUT" ? "TIMED_OUT" : "FAILED",
          };
          setRunStats(finalStats);
          setPhase("DONE");
          setMessage(
            finalStats.status === "TIMED_OUT"
              ? "Time ran out. This competitive run is over."
              : "Wrong answer. This competitive run is over.",
          );
          const preview = computeProgressiveRunScore(
            { ...finalStats, game: "rapid-math-relay" },
            finalStats.totalElapsedMs,
          );
          setScore(preview);
          onFinish({ scoreMs: preview, meta: { competitiveRun: true, game: "rapid-math-relay" } });
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
        setDraft("");
        setMessage(`Correct. Level ${Number(data.nextChallenge?.level || level + 1)} is ready.`);
        startedAtRef.current = Date.now();
        setNowMs(Date.now());
      } catch (error: any) {
        setMessage(error?.message || "Could not continue.");
      } finally {
        setPending(false);
      }
      return;
    }

    const success = !timedOut && answerValue === localServerChallenge.answer;
    const nextElapsed = runStats.totalElapsedMs + elapsedForLevel;
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
      setMessage(timedOut ? "Time ran out. Practice run over." : "Wrong answer. Practice run over.");
      const preview = computeProgressiveRunScore(
        { ...finalStats, game: "rapid-math-relay" },
        nextElapsed,
      );
      setScore(preview);
      onFinish({
        scoreMs: preview,
        meta: { game: "rapid-math-relay", levelsCleared: finalStats.levelsCleared },
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
    setDraft("");
    setMessage(`Correct. Level ${level + 1} is ready.`);
    startedAtRef.current = Date.now();
    setNowMs(Date.now());
  }

  useEffect(() => {
    if (phase !== "RUNNING" || pending || remainingMs > 0) return;
    void resolveLevel(true);
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
    setDraft("");
    setMessage("Answer correctly before the timer expires. Every new level gets a little tighter.");
    setScore(null);
    startedAtRef.current = Date.now();
    setNowMs(Date.now());
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Objective</div>
        <h3 className="mt-2 text-xl font-black text-slate-950">Rapid Math Relay</h3>
        <p className="mt-2 text-sm text-slate-600">
          One equation per level. Keep solving before the timer hits zero. The run ends on the first wrong answer or timeout.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Run</div>
          <div className="mt-1 text-2xl font-black text-slate-950">L{level}</div>
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
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Question</div>
            <p className="mt-1 text-sm text-slate-600">Higher level, fewer mistakes, faster run.</p>
          </div>
          <button
            type="button"
            onClick={start}
            disabled={disabled || pending || phase === "RUNNING"}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {phase === "READY" ? "Start run" : "Restart run"}
          </button>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-5 text-center text-2xl font-black text-slate-950 sm:text-3xl">
          {prompt}
        </div>

        {phase === "RUNNING" ? (
          <div className="mt-4">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value.replace(/[^0-9\-]/g, ""))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void resolveLevel(false);
                }
              }}
              disabled={disabled || pending}
              placeholder="Answer"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-xl font-black text-slate-900 outline-none transition focus:border-slate-900"
            />
            <button
              type="button"
              onClick={() => void resolveLevel(false)}
              disabled={disabled || pending || !draft.trim()}
              className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {pending ? "Checking..." : "Submit answer"}
            </button>
          </div>
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
