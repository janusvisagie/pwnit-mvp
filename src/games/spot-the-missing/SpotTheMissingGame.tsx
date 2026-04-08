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

type RunStats = { levelsCleared: number; mistakes: number; totalElapsedMs: number; totalRevealCount: number; status: "RUNNING" | "FAILED" | "TIMED_OUT" };

function buildLocalChallenge(level: number) {
  const server = buildProgressiveRunChallenge("spot-the-missing", level);
  return { server, public: buildPublicProgressiveRunChallenge(server, 0) as PublicChallenge };
}

export default function SpotTheMissingGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<PublicChallenge>) {
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const initialLocal = useMemo(() => buildLocalChallenge(1), []);
  const [publicChallenge, setPublicChallenge] = useState<PublicChallenge>(injectedChallenge ?? initialLocal.public);
  const [localServerChallenge, setLocalServerChallenge] = useState<any>(initialLocal.server);
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [runStats, setRunStats] = useState<RunStats>({ levelsCleared: 0, mistakes: 0, totalElapsedMs: 0, totalRevealCount: 0, status: "RUNNING" });
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (injectedChallenge) {
      setPublicChallenge(injectedChallenge);
      setPhase("READY");
      setMessage(null);
      setScore(null);
      setPending(false);
      setRunStats({ levelsCleared: 0, mistakes: 0, totalElapsedMs: 0, totalRevealCount: 0, status: "RUNNING" });
      startedAtRef.current = null;
    }
  }, [injectedChallenge]);

  const level = publicChallenge.level ?? 1;
  const timeLimitMs = publicChallenge.timeLimitMs ?? 9000;
  const remainingMs = phase === "RUNNING" && startedAtRef.current ? Math.max(0, timeLimitMs - (Date.now() - startedAtRef.current)) : timeLimitMs;

  async function resolveLevel(selectedId: string | null, timedOut = false) {
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    if (verifiedMode) {
      setPending(true);
      try {
        const res = await fetch("/api/attempt/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId: injectedChallenge?.attemptId, action: "resolve_level", selectedId, elapsedMs, timedOut }) });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) { setMessage(data?.error || `Could not continue (${res.status})`); return; }
        if (data.finished) {
          const finalStats: RunStats = { levelsCleared: Number(data.run?.levelsCleared || 0), mistakes: Number(data.run?.mistakes || 0), totalElapsedMs: Number(data.run?.totalElapsedMs || elapsedMs), totalRevealCount: 0, status: data.run?.status === "TIMED_OUT" ? "TIMED_OUT" : "FAILED" };
          setRunStats(finalStats); setPhase("DONE"); setMessage(finalStats.status === "TIMED_OUT" ? "Time ran out. This competitive run is over." : "Wrong answer. This competitive run is over.");
          const preview = computeProgressiveRunScore({ ...finalStats, game: "spot-the-missing" }, finalStats.totalElapsedMs); setScore(preview); onFinish({ scoreMs: preview, meta: { competitiveRun: true, game: "spot-the-missing" } }); return;
        }
        setPublicChallenge({ ...(data.nextChallenge || publicChallenge), attemptId: injectedChallenge?.attemptId });
        setRunStats({ levelsCleared: Number(data.run?.levelsCleared || 0), mistakes: Number(data.run?.mistakes || 0), totalElapsedMs: Number(data.run?.totalElapsedMs || 0), totalRevealCount: 0, status: "RUNNING" });
        setMessage(`Correct. Level ${Number(data.nextChallenge?.level || level + 1)} is ready.`); startedAtRef.current = Date.now();
      } catch (error: any) { setMessage(error?.message || "Could not continue."); } finally { setPending(false); }
      return;
    }
    const success = !timedOut && selectedId === localServerChallenge.missing;
    const nextElapsed = runStats.totalElapsedMs + elapsedMs;
    if (!success) {
      const finalStats: RunStats = { levelsCleared: runStats.levelsCleared, mistakes: runStats.mistakes + 1, totalElapsedMs: nextElapsed, totalRevealCount: 0, status: timedOut ? "TIMED_OUT" : "FAILED" };
      setRunStats(finalStats); setPhase("DONE"); setMessage(timedOut ? "Time ran out. Practice run over." : "Wrong answer. Practice run over.");
      const preview = computeProgressiveRunScore({ ...finalStats, game: "spot-the-missing" }, nextElapsed); setScore(preview); onFinish({ scoreMs: preview, meta: { game: "spot-the-missing", levelsCleared: finalStats.levelsCleared } }); return;
    }
    const next = buildLocalChallenge(level + 1); setLocalServerChallenge(next.server as any); setPublicChallenge(next.public); setRunStats({ levelsCleared: runStats.levelsCleared + 1, mistakes: runStats.mistakes, totalElapsedMs: nextElapsed, totalRevealCount: 0, status: "RUNNING" }); setMessage(`Correct. Level ${level + 1} is ready.`); startedAtRef.current = Date.now();
  }

  useEffect(() => { if (phase !== "RUNNING" || pending || remainingMs > 0) return; void resolveLevel(null, true); }, [phase, pending, remainingMs]);

  function start() {
    if (disabled) return;
    const local = !verifiedMode ? buildLocalChallenge(1) : null;
    if (local) { setLocalServerChallenge(local.server as any); setPublicChallenge(local.public); setRunStats({ levelsCleared: 0, mistakes: 0, totalElapsedMs: 0, totalRevealCount: 0, status: "RUNNING" }); }
    setPhase("RUNNING"); setMessage("Choose the token that is missing from the original row. The run continues until you miss one or run out of time."); setScore(null); startedAtRef.current = Date.now();
  }

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div><h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Spot the Missing</h3><p className="mt-2 text-sm text-slate-600">Remember the full row, then pick the missing token from the answer options. Each level gets a little tighter.</p></div><div className="rounded-2xl bg-slate-900 px-3 py-2 text-right text-white"><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Run</div><div className="text-lg font-black">L{level}</div><div className="text-xs text-slate-300">Cleared {runStats.levelsCleared}</div></div></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Shown row</div><div className="mt-1 text-sm font-bold text-slate-900">{(publicChallenge.shown ?? []).join(" • ")}</div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Visible now</div><div className="mt-1 text-sm font-bold text-slate-900">{(publicChallenge.remaining ?? []).join(" • ")}</div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Time left</div><div className="mt-1 text-lg font-black text-slate-900">{Math.ceil(remainingMs / 1000)}s</div></div></div>
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={start} disabled={disabled || pending || phase === "RUNNING"} className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-50">{phase === "READY" ? "Start run" : "Restart run"}</button></div>
      <div className="mt-5"><div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Available answer options</div><div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">{(publicChallenge.options ?? []).map((option) => (<button key={option} type="button" onClick={() => void resolveLevel(option, false)} disabled={disabled || pending || phase !== "RUNNING"} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:border-slate-300 disabled:opacity-50">{option}</button>))}</div></div>
      {message ? <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</div> : null}
      {score != null ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">Run score {score.toLocaleString("en-ZA")}</div> : null}
    </div>
  );
}
