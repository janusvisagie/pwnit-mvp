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

const GAME_REGISTRY: Record<GameKey, { title: string; Component: any }> = {
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
  credits: number; // TOTAL credits (free + paid)
};

function ConfettiOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes pwnit-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(280px) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {Array.from({ length: 24 }).map((_, i) => {
        const left = (i * 100) / 24;
        const delay = (i % 6) * 0.05;
        const size = 6 + (i % 4) * 2;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: 0,
              width: size,
              height: size,
              borderRadius: 2,
              background: i % 2 === 0 ? "#0f172a" : "#94a3b8",
              animation: `pwnit-fall 0.9s ease-in ${delay}s 1`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function GameHost({ itemId, gameKey, playCost, credits }: Props) {
  const router = useRouter();

  const canPay = credits >= playCost;

  // If they can't pay, we force practice on.
  const [practiceMode, setPracticeMode] = useState(!canPay);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ scoreMs: number } | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [status, setStatus] = useState<null | {
    myRank: number;
    totalPlayers: number;
    cutoffPct: number;
    cutoffRank: number;
    state: "WINNING" | "ALMOST" | "PLAYING";
  }>(null);

  const disabled = submitting;

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

    // Only show the “not enough credits” error WHEN attempting another submission.
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

      router.refresh();
    } catch (e: any) {
      setErrMsg(e?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">{entry.title}</div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-slate-700">
            Cost: <span className="text-slate-900">{playCost}</span> • You have{" "}
            <span className="text-slate-900">{credits}</span>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={practiceMode || !canPay}
              onChange={(e) => setPracticeMode(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
              disabled={!canPay}
            />
            Practice (no score)
          </label>
        </div>
      </div>

      {/* Only show the warning if they truly cannot pay */}
      {!canPay ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="font-semibold">Not enough credits to submit a score.</div>
          <div className="mt-1 text-xs text-amber-800">Practice is enabled until you buy more credits.</div>
        </div>
      ) : null}

      {/* Result chip */}
      {result ? (
        <div className="text-xs text-slate-600">
          {practiceMode ? "Practice result" : "Submitted"} • Score{" "}
          <span className="font-semibold text-slate-900">{result.scoreMs}ms</span>
        </div>
      ) : null}

      {/* Psychology status */}
      {status ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <div className="font-semibold text-slate-900">
            Live standing: #{status.myRank} / {status.totalPlayers}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Winners right now: Top {status.cutoffPct}% (#{status.cutoffRank} cutoff)
          </div>

          {status.state === "WINNING" ? (
            <div className="mt-2 text-sm font-semibold text-slate-900">🎉 You’re currently in the winning zone.</div>
          ) : status.state === "ALMOST" ? (
            <div className="mt-2 text-sm font-semibold text-slate-900">😮 Almost won — you’re right on the edge. Try again.</div>
          ) : null}
        </div>
      ) : null}

      {errMsg ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="font-semibold">Couldn’t submit your score</div>
          <div className="mt-1 text-xs text-rose-700">{errMsg}</div>
        </div>
      ) : null}

      {/* Game surface */}
      <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <ConfettiOverlay show={!practiceMode && status?.state === "WINNING"} />
        <Game disabled={disabled} onFinish={(r: any) => submitAttempt({ scoreMs: r.scoreMs, meta: r.meta })} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          className={[
            "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold",
            submitting ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800",
          ].join(" ")}
          onClick={() => router.push(`/item/${itemId}/leaderboard`)}
          disabled={submitting}
        >
          View leaderboard
        </button>

        <button
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          onClick={() => router.push(`/item/${itemId}`)}
          disabled={submitting}
        >
          Back to item
        </button>
      </div>
    </div>
  );
}
