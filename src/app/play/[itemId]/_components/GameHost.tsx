// src/app/play/[itemId]/_components/GameHost.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import PrecisionTimerGame from "@/games/precision-timer/PrecisionTimerGame";
import RhythmHoldGame from "@/games/rhythm-hold/RhythmHoldGame";
import TapSpeedGame from "@/games/tap-speed/TapSpeedGame";
import NumberMemoryGame from "@/games/number-memory/NumberMemoryGame";
import TargetHoldGame from "@/games/target-hold/TargetHoldGame";
import StopZeroGame from "@/games/stop-zero/StopZeroGame";
import TapPatternGame from "@/games/tap-pattern/TapPatternGame";

type GameKey =
  | "precision-timer"
  | "rhythm-hold"
  | "tap-speed"
  | "number-memory"
  | "target-hold"
  | "stop-zero"
  | "tap-pattern";

const GAME_REGISTRY: Record<
  GameKey,
  { title: string; Component: React.ComponentType<any> }
> = {
  "precision-timer": { title: "Precision Timer", Component: PrecisionTimerGame },
  "rhythm-hold": { title: "Rhythm Hold", Component: RhythmHoldGame },
  "tap-speed": { title: "Tap Speed", Component: TapSpeedGame },
  "number-memory": { title: "Number Memory", Component: NumberMemoryGame },
  "target-hold": { title: "Target Hold", Component: TargetHoldGame },
  "stop-zero": { title: "Stop Zero", Component: StopZeroGame },
  "tap-pattern": { title: "Tap Pattern", Component: TapPatternGame },
};

type Props = {
  itemId: string;
  gameKey: GameKey;
  playCost: number;
  credits: number; // TOTAL credits (free + paid) - used for gating only, not displayed
};

function ConfettiOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 24 }).map((_, i) => {
        const left = (i * 100) / 24;
        const delay = (i % 6) * 0.05;
        const size = 6 + (i % 4) * 2;
        return (
          <div
            key={i}
            className="absolute top-0 animate-[pwnit_confetti_1.2s_ease-out_forwards] rounded-full bg-slate-900/20"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
      <style jsx global>{`
        @keyframes pwnit_confetti {
          0% {
            transform: translateY(-10px);
            opacity: 1;
          }
          100% {
            transform: translateY(340px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function GameHost({ itemId, gameKey, playCost, credits }: Props) {
  const router = useRouter();
  const canPay = credits >= playCost;

  // If they can't pay, force practice on.
  const [practiceMode, setPracticeMode] = useState(!canPay);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ scoreMs: number } | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);

  const entry = GAME_REGISTRY[gameKey] ?? GAME_REGISTRY["precision-timer"];
  const Game = useMemo(() => entry.Component, [entry.Component]);

  async function submitAttempt(payload: { scoreMs: number; meta?: any }) {
    // Practice: do not submit
    if (practiceMode) {
      setResult({ scoreMs: payload.scoreMs });
      setStatus(null);
      setErrMsg(null);
      return;
    }

    // Only show the “not enough credits” error WHEN attempting submission.
    if (credits < playCost) {
      setErrMsg("Not enough credits to submit. Practice mode only.");
      return;
    }

    setSubmitting(true);
    setErrMsg(null);

    try {
      const res = await fetch("/api/attempt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          itemId,
          scoreMs: payload.scoreMs,
          meta: payload.meta ?? null,
        }),
      });

      let data: any = null;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) data = await res.json().catch(() => null);
      else data = { ok: false, error: await res.text().catch(() => "Non-JSON error") };

      if (!res.ok || !data?.ok) {
        setErrMsg(data?.error || `Submit failed (${res.status})`);
        return;
      }

      setResult({ scoreMs: payload.scoreMs });
      setStatus({
        myRank: Number(data.myRank || 0),
        totalPlayers: Number(data.totalPlayers || 0),
        cutoffPct: Number(data.cutoffPct || 5),
        cutoffRank: Number(data.cutoffRank || 1),
        state: (data.status || "PLAYING") as any,
      });

      // Refresh server components + tell header credits pill to re-fetch
      router.refresh();
      window.dispatchEvent(new Event("pwnit:credits"));
    } catch (e: any) {
      setErrMsg(e?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative">
      <ConfettiOverlay show={!!status && status.state === "WINNING"} />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">{entry.title}</div>

        <div className="flex items-center gap-2 text-xs text-slate-700">
          <span className="rounded-full border border-slate-200 bg-white px-2 py-1">
            Cost: {playCost}
          </span>

          <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
            <input
              type="checkbox"
              checked={practiceMode}
              onChange={(e) => setPracticeMode(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
              disabled={!canPay}
            />
            Practice
          </label>
        </div>
      </div>

      {!canPay ? (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Not enough credits to submit a score. Practice is enabled until you buy more credits.
        </div>
      ) : null}

      {result ? (
        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800">
          {practiceMode ? "Practice result" : "Submitted"} • Score {result.scoreMs}ms
        </div>
      ) : null}

      {status ? (
        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800">
          Live standing: #{status.myRank} / {status.totalPlayers}
          <div className="mt-1 text-slate-600">
            Winners right now: Top {status.cutoffPct}% (#{status.cutoffRank} cutoff)
          </div>
          {status.state === "WINNING" ? (
            <div className="mt-1 font-semibold text-slate-900">
              You’re currently in the winning zone.
            </div>
          ) : status.state === "ALMOST" ? (
            <div className="mt-1 font-semibold text-slate-900">
              Almost won — you’re right on the edge. Try again.
            </div>
          ) : null}
        </div>
      ) : null}

      {errMsg ? (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
          <div className="font-semibold">Couldn’t submit your score</div>
          <div className="mt-1">{errMsg}</div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <Game onFinish={(r: any) => submitAttempt({ scoreMs: r.scoreMs, meta: r.meta })} onResult={(r: any) => submitAttempt({ scoreMs: r.scoreMs, meta: r.meta })} disabled={submitting} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => router.push(`/item/${itemId}/leaderboard`)}
          disabled={submitting}
        >
          View leaderboard
        </button>
        <button
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => router.push(`/item/${itemId}`)}
          disabled={submitting}
        >
          Back to item
        </button>
      </div>
    </div>
  );
}
