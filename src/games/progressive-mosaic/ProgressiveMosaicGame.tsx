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
  targetGlyph?: string;
  palette?: [string, string];
  overlayOrder?: number[];
  tileCount?: number;
  shownRevealCount?: number;
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
  const totalSeconds = safeMs / 1000;
  if (totalSeconds < 10) return `${totalSeconds.toFixed(1)}s`;
  const wholeSeconds = Math.ceil(totalSeconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = wholeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getVisibleTileCount(shownRevealCount: number, maxReveals: number, tileCount: number) {
  const progress = maxReveals <= 1 ? 1 : shownRevealCount / maxReveals;
  return Math.max(2, Math.min(tileCount, Math.round(progress * tileCount)));
}

function getBlurPx(shownRevealCount: number, maxReveals: number) {
  const progress = maxReveals <= 1 ? 1 : shownRevealCount / maxReveals;
  return Math.max(0, 16 - progress * 14);
}

export default function ProgressiveMosaicGame({
  onFinish,
  disabled,
  challenge: injectedChallenge,
}: GameProps<PublicChallenge>) {
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const initialLocal = useMemo(() => buildLocalChallenge(1), []);
  const [publicChallenge, setPublicChallenge] = useState<PublicChallenge>(injectedChallenge ?? initialLocal.public);
  const [localServerChallenge, setLocalServerChallenge] = useState<any>(initialLocal.server);
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [runStats, setRunStats] = useState<RunStats>({
    levelsCleared: 0,
    mistakes: 0,
    totalElapsedMs: 0,
    totalRevealCount: publicChallenge.shownRevealCount ?? 1,
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
      totalRevealCount: injectedChallenge.shownRevealCount ?? 1,
      status: "RUNNING",
    });
    setPhase("READY");
    setMessage(null);
    setScore(null);
    setPending(false);
    setNowMs(Date.now());
    startedAtRef.current = null;
  }, [injectedChallenge]);

  useEffect(() => {
    if (phase !== "RUNNING") return;
    setNowMs(Date.now());
    const timer = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  const shownRevealCount = publicChallenge.shownRevealCount ?? 1;
  const maxReveals = publicChallenge.maxReveals ?? shownRevealCount;
  const timeLimitMs = publicChallenge.timeLimitMs ?? 12000;
  const level = publicChallenge.level ?? 1;
  const options = publicChallenge.options ?? [];
  const tileCount = publicChallenge.tileCount ?? 16;
  const overlayOrder =
    publicChallenge.overlayOrder ?? Array.from({ length: tileCount }, (_, index) => index);
  const targetGlyph = publicChallenge.targetGlyph ?? "❓";
  const palette = publicChallenge.palette ?? ["#0f172a", "#334155"];
  const elapsedMs =
    phase === "RUNNING" && startedAtRef.current ? Math.max(0, nowMs - startedAtRef.current) : 0;
  const remainingMs = Math.max(0, timeLimitMs - elapsedMs);
  const visibleTileCount = getVisibleTileCount(shownRevealCount, maxReveals, tileCount);
  const blurPx = getBlurPx(shownRevealCount, maxReveals);
  const visibleSet = useMemo(
    () => new Set(overlayOrder.slice(0, visibleTileCount)),
    [overlayOrder, visibleTileCount],
  );

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
              : "Wrong answer. This competitive run is over.",
          );
          const preview = computeProgressiveRunScore(
            { ...nextStats, game: "progressive-mosaic" },
            nextStats.totalElapsedMs,
          );
          setScore(preview);
          onFinish({ scoreMs: preview, meta: { competitiveRun: true, game: "progressive-mosaic" } });
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
          totalRevealCount: Number(data.run?.totalRevealCount || 0),
          status: "RUNNING",
        });
        setMessage(`Correct. Level ${Number(data.nextChallenge?.level || level + 1)} starts with a fresh obscured target.`);
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
      setMessage(timedOut ? "Time ran out. Practice run over." : "Wrong answer. Practice run over.");
      const preview = computeProgressiveRunScore(
        { ...finalStats, game: "progressive-mosaic" },
        nextElapsed,
      );
      setScore(preview);
      onFinish({
        scoreMs: preview,
        meta: { game: "progressive-mosaic", levelsCleared: finalStats.levelsCleared },
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
      totalRevealCount: runStats.totalRevealCount + (next.public.shownRevealCount ?? 1),
      status: "RUNNING",
    });
    setMessage(`Correct. Level ${level + 1} begins with a new obscured target.`);
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
        totalRevealCount: local.public.shownRevealCount ?? 1,
        status: "RUNNING",
      });
    }
    setPhase("RUNNING");
    setMessage("Sharpen only when needed, then lock in the correct prize.");
    setScore(null);
    startedAtRef.current = Date.now();
    setNowMs(Date.now());
  }

  async function revealNext() {
    if (disabled || pending || phase !== "RUNNING" || shownRevealCount >= maxReveals) return;
    if (!verifiedMode) {
      const nextShown = Math.min(maxReveals, shownRevealCount + 1);
      setPublicChallenge({ ...publicChallenge, shownRevealCount: nextShown });
      setRunStats((prev) => ({ ...prev, totalRevealCount: prev.totalRevealCount + 1 }));
      setMessage(
        nextShown >= maxReveals
          ? "All sharpen steps used. Pick your answer."
          : "A few more tiles opened and the blur eased.",
      );
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
      setPublicChallenge((prev) => ({ ...prev, shownRevealCount: Number(data.shownRevealCount || shownRevealCount) }));
      setRunStats((prev) => ({ ...prev, totalRevealCount: prev.totalRevealCount + 1 }));
      setMessage(
        data.exhausted
          ? "All sharpen steps used. Pick your answer."
          : "A few more tiles opened and the blur eased.",
      );
    } catch (error: any) {
      setMessage(error?.message || "Could not sharpen the target.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Progressive Mosaic
          </div>
          <div className="mt-1 text-sm font-black text-slate-950">Sharpen the hidden prize, then answer fast.</div>
        </div>
        <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
          Sharpens {shownRevealCount}/{maxReveals}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="uppercase tracking-[0.14em] text-slate-500">Level</div>
          <div className="mt-0.5 text-base font-black text-slate-900">L{level}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="uppercase tracking-[0.14em] text-slate-500">Cleared</div>
          <div className="mt-0.5 text-base font-black text-slate-900">{runStats.levelsCleared}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="uppercase tracking-[0.14em] text-slate-500">Time left</div>
          <div className="mt-0.5 text-base font-black text-slate-900">{formatCountdown(remainingMs)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="uppercase tracking-[0.14em] text-slate-500">Scoring</div>
          <div className="mt-0.5 font-bold text-slate-900">Less help, better finish</div>
        </div>
      </div>

      <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Obscured target reveal
        </div>

        <div
          className="relative mt-2 overflow-hidden rounded-[26px] border border-slate-200"
          style={{
            minHeight: 168,
            background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center select-none"
            style={{
              filter: `blur(${blurPx.toFixed(1)}px) saturate(1.05)`,
              transform: "scale(1.06)",
            }}
          >
            <span className="text-[84px] drop-shadow-[0_10px_22px_rgba(15,23,42,0.32)] sm:text-[96px]">
              {targetGlyph}
            </span>
          </div>

          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-[3px] p-[6px]">
            {Array.from({ length: tileCount }, (_, index) => (
              <div
                key={index}
                className={`rounded-xl transition-all duration-200 ${
                  visibleSet.has(index)
                    ? "bg-white/0 backdrop-blur-0"
                    : "bg-slate-950/36 backdrop-blur-[1px]"
                }`}
              />
            ))}
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/55 via-slate-950/20 to-transparent px-3 pb-3 pt-8 text-[11px] font-semibold text-white">
            Revealed tiles {visibleTileCount}/{tileCount}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={start}
          disabled={disabled || pending || phase === "RUNNING"}
          className="rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {phase === "READY" ? "Start run" : "Replay"}
        </button>
        <button
          type="button"
          onClick={() => void revealNext()}
          disabled={disabled || pending || phase !== "RUNNING" || shownRevealCount >= maxReveals}
          className="rounded-2xl bg-slate-900 px-3.5 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "Working..." : shownRevealCount >= maxReveals ? "All sharpen steps used" : "Sharpen image"}
        </button>
      </div>

      <div className="mt-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Answer options
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => void resolveLevel(option.id, false)}
              disabled={disabled || pending || phase !== "RUNNING"}
              className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl text-white shadow-sm">
                  {option.emoji}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Choose prize
                  </div>
                  <div className="mt-0.5 truncate text-sm font-black text-slate-950">{option.label}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {message ? (
        <div className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm text-indigo-900">
          {message}
        </div>
      ) : null}
      {score != null ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-black text-emerald-700">
          Run score {score.toLocaleString("en-ZA")}
        </div>
      ) : null}
    </div>
  );
}
