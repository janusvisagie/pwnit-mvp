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

type RunStats = { levelsCleared: number; mistakes: number; totalElapsedMs: number; totalRevealCount: number; status: "RUNNING" | "FAILED" | "TIMED_OUT" };

function buildLocalChallenge(level: number) {
  const server = buildProgressiveRunChallenge("rapid-math-relay", level);
  return { server, public: buildPublicProgressiveRunChallenge(server, 0) as PublicChallenge };
}

export default function RapidMathRelayGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<PublicChallenge>) {
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const initialLocal = useMemo(() => buildLocalChallenge(1), []);
  const [publicChallenge, setPublicChallenge] = useState<PublicChallenge>(injectedChallenge ?? initialLocal.public);
  const [localServerChallenge, setLocalServerChallenge] = useState<any>(initialLocal.server);
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [runStats, setRunStats] = useState<RunStats>({ levelsCleared: 0, mistakes: 0, totalElapsedMs: 0, totalRevealCount: 0, status: "RUNNING" });
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (injectedChallenge) {
      setPublicChallenge(injectedChallenge); setPhase("READY"); setDraft(""); setMessage(null); setScore(null); setPending(false); setRunStats({ levelsCleared: 0, mistakes: 0, totalElapsedMs: 0, totalRevealCount: 0, status: "RUNNING" }); startedAtRef.current = null;
    }
  }, [injectedChallenge]);

  const level = publicChallenge.level ?? 1;
  const prompt = publicChallenge.prompt ?? "?";
  const timeLimitMs = publicChallenge.timeLimitMs ?? 8000;
  const remainingMs = phase === "RUNNING" && startedAtRef.current ? Math.max(0, timeLimitMs - (Date.now() - startedAtRef.current)) : timeLimitMs;

  async function resolveLevel(timedOut = false) {
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const answerValue = timedOut ? null : Number(draft);
    if (verifiedMode) {
      setPending(true);
      try {
        const res = await fetch("/api/attempt/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId: injectedChallenge?.attemptId, action: "resolve_level", answer: answerValue, elapsedMs, timedOut }) });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) { setMessage(data?.error || `Could not continue (${res.status})`); return; }
        if (data.finished) {
          const finalStats: RunStats = { levelsCleared: Number(data.run?.levelsCleared || 0), mistakes: Number(data.run?.mistakes || 0), totalElapsedMs: Number(data.run?.totalElapsedMs || elapsedMs), totalRevealCount: 0, status: data.run?.status === "TIMED_OUT" ? "TIMED_OUT" : "FAILED" };
          setRunStats(finalStats); setPhase("DONE"); setMessage(finalStats.status === "TIMED_OUT" ? "Time ran out. This competitive run is over." : "Wrong answer. This competitive run is over.");
          const preview = computeProgressiveRunScore({ ...finalStats, game: "rapid-math-relay" }, finalStats.totalElapsedMs); setScore(preview); onFinish({ scoreMs: preview, meta: { competitiveRun: true, game: "rapid-math-relay" } }); return;
        }
        setPublicChallenge({ ...(data.nextChallenge || publicChallenge), attemptId: injectedChallenge?.attemptId }); setRunStats({ levelsCleared: Number(data.run?.levelsCleared || 0), mistakes: Number(data.run?.mistakes || 0), totalElapsedMs: Number(data.run?.totalElapsedMs || 0), totalRevealCount: 0, status: "RUNNING" }); setDraft(""); setMessage(`Correct. Level ${Number(data.nextChallenge?.level || level + 1)} is ready.`); startedAtRef.current = Date.now();
      } catch (error: any) { setMessage(error?.message || "Could not continue."); } finally { setPending(false); }
      return;
    }
    const success = !timedOut && answerValue === localServerChallenge.answer;
    const nextElapsed = runStats.totalElapsedMs + elapsedMs;
    if (!success) {
      const finalStats: RunStats = { levelsCleared: runStats.levelsCleared, mistakes: runStats.mistakes + 1, totalElapsedMs: nextElapsed, totalRevealCount: 0, status: timedOut ? "TIMED_OUT" : "FAILED" };
      setRunStats(finalStats); setPhase("DONE"); setMessage(timedOut ? "Time ran out. Practice run over." : "Wrong answer. Practice run over."); const preview = computeProgressiveRunScore({ ...finalStats, game: "rapid-math-relay" }, nextElapsed); setScore(preview); onFinish({ scoreMs: preview, meta: { game: "rapid-math-relay", levelsCleared: finalStats.levelsCleared } }); return;
    }
    const next = buildLocalChallenge(level + 1); setLocalServerChallenge(next.server as any); setPublicChallenge(next.public); setRunStats({ levelsCleared: runStats.levelsCleared + 1, mistakes: runStats.mistakes, totalElapsedMs: nextElapsed, totalRevealCount: 0, status: "RUNNING" }); setDraft(""); setMessage(`Correct. Level ${level + 1} is ready.`); startedAtRef.current = Date.now();
  }

  useEffect(() => { if (phase !== "RUNNING" || pending || remainingMs > 0) return; void resolveLevel(true); }, [phase, pending, remainingMs]);

  function start() {
    if (disabled) return;
    const local = !verifiedMode ? buildLocalChallenge(1) : null;
    if (local) { setLocalServerChallenge(local.server as any); setPublicChallenge(local.public); setRunStats({ levelsCleared: 0, mistakes: 0, totalElapsedMs: 0, totalRevealCount: 0, status: "RUNNING" }); }
    setPhase("RUNNING"); setDraft(""); setMessage("Answer correctly before the timer expires. Every new level gets a little tighter."); setScore(null); startedAtRef.current = Date.now();
  }

  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Objective</p><h3 className="mt-1 text-2xl font-black text-slate-900">Rapid Math Relay</h3><p className="mt-2 text-sm text-slate-600">One equation per level. Keep solving correctly before the timer runs out. The run ends on the first mistake or time-out.</p></div><div className="rounded-2xl bg-slate-900 px-3 py-2 text-right text-white"><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Run</div><div className="text-lg font-black">L{level}</div><div className="text-xs text-slate-300">Cleared {runStats.levelsCleared}</div></div></div>
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Question</div><div className="mt-1 text-lg font-black text-slate-900">{prompt}</div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Time left</div><div className="mt-1 text-lg font-black text-slate-900">{Math.ceil(remainingMs / 1000)}s</div></div><div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Scoring</div><div className="mt-1 text-sm font-bold text-slate-900">Higher level, fewer mistakes, faster run</div></div></div>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center"><div className="text-4xl font-black tracking-tight text-slate-900">{prompt}</div>{phase === "RUNNING" ? <div className="mx-auto mt-5 max-w-xs"><input inputMode="numeric" autoFocus value={draft} onChange={(event) => setDraft(event.target.value.replace(/[^0-9\-]/g, ""))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void resolveLevel(false); } }} disabled={disabled || pending} placeholder="Answer" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-xl font-black text-slate-900 outline-none transition focus:border-slate-900" /><button type="button" onClick={() => void resolveLevel(false)} disabled={disabled || pending || !draft.trim()} className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{pending ? "Checking..." : "Submit answer"}</button></div> : <button type="button" onClick={start} disabled={disabled} className="mt-4 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{phase === "READY" ? "Start run" : "Restart run"}</button>}</div>
      {message ? <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">{message}</div> : null}
      {score != null ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">Run score {score.toLocaleString("en-ZA")}</div> : null}
    </div>
  );
}
