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
  { title: string; subtitle: string; accent: string; Component: React.ComponentType<any> }
> = {
  "precision-timer": {
    title: "Precision Timer",
    subtitle: "Hit the target time as closely as you can.",
    accent: "from-cyan-400 to-sky-500",
    Component: PrecisionTimerGame,
  },
  "rhythm-hold": {
    title: "Rhythm Hold",
    subtitle: "Press and release with perfect timing.",
    accent: "from-violet-400 to-fuchsia-500",
    Component: RhythmHoldGame,
  },
  "tap-speed": {
    title: "Tap Speed",
    subtitle: "React instantly when the screen turns live.",
    accent: "from-emerald-400 to-teal-500",
    Component: TapSpeedGame,
  },
  "number-memory": {
    title: "Number Memory",
    subtitle: "Memorise the sequence, then enter it fast.",
    accent: "from-amber-400 to-orange-500",
    Component: NumberMemoryGame,
  },
  "target-hold": {
    title: "Target Hold",
    subtitle: "Hold to the exact target length.",
    accent: "from-rose-400 to-pink-500",
    Component: TargetHoldGame,
  },
  "stop-zero": {
    title: "Stop Zero",
    subtitle: "Stop the countdown as close to zero as possible.",
    accent: "from-blue-400 to-indigo-500",
    Component: StopZeroGame,
  },
  "tap-pattern": {
    title: "Tap Pattern",
    subtitle: "Follow the pattern cleanly and quickly.",
    accent: "from-slate-500 to-slate-800",
    Component: TapPatternGame,
  },
};

type Props = {
  itemId: string;
  gameKey: GameKey;
  playCost: number;
  credits: number;
};

function ConfettiOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
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
  const [practiceMode, setPracticeMode] = useState(!canPay);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ scoreMs: number } | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);

  const entry = GAME_REGISTRY[gameKey] ?? GAME_REGISTRY["precision-timer"];
  const Game = useMemo(() => entry.Component, [entry.Component]);

  async function submitAttempt(payload: { scoreMs: number; meta?: any }) {
    if (practiceMode) {
      setResult({ scoreMs: payload.scoreMs });
      setStatus(null);
      setErrMsg(null);
      return;
    }

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
      window.dispatchEvent(new Event("pwnit:credits"));
    } catch (e: any) {
      setErrMsg(e?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
      <ConfettiOverlay show={!!status && status.state === "WINNING"} />

      <div className={`relative overflow-hidden bg-gradient-to-br ${entry.accent} px-5 py-5 text-white sm:px-6`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_28%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">
              Live skill game
            </div>
            <div className="mt-2 text-2xl font-black tracking-tight">{entry.title}</div>
            <div className="mt-1 max-w-xl text-sm text-white/85">{entry.subtitle}</div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-semibold text-slate-900">
            <span className="rounded-full border border-white/40 bg-white/90 px-3 py-1.5 shadow-sm">
              {playCost} {playCost === 1 ? "credit" : "credits"} / play
            </span>
            <label className="flex items-center gap-2 rounded-full border border-white/40 bg-white/90 px-3 py-1.5 shadow-sm">
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
      </div>

      <div className="p-4 sm:p-5">
        {!canPay ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Not enough credits to submit a score. Practice mode is on until you top up.
          </div>
        ) : null}

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Mode</div>
            <div className="mt-1 text-sm font-bold text-slate-900">
              {practiceMode ? "Practice run" : "Live score"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Last result</div>
            <div className="mt-1 text-sm font-bold text-slate-900">
              {result ? `${result.scoreMs}ms` : "No score yet"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Status</div>
            <div className="mt-1 text-sm font-bold text-slate-900">
              {submitting ? "Submitting…" : practiceMode ? "Practice only" : "Ready to submit"}
            </div>
          </div>
        </div>

        {status ? (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
            <div className="font-semibold text-slate-900">
              Live standing: #{status.myRank} / {status.totalPlayers}
            </div>
            <div className="mt-1 text-slate-600">
              Winners right now: Top {status.cutoffPct}% (#{status.cutoffRank} cutoff)
            </div>
            {status.state === "WINNING" ? (
              <div className="mt-2 font-semibold text-emerald-700">You’re currently in the winning zone.</div>
            ) : status.state === "ALMOST" ? (
              <div className="mt-2 font-semibold text-sky-700">Almost there — one stronger run could push you in.</div>
            ) : null}
          </div>
        ) : null}

        {errMsg ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <div className="font-semibold">Couldn’t submit your score</div>
            <div className="mt-1">{errMsg}</div>
          </div>
        ) : null}

        <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 sm:p-5">
          <Game
            onFinish={submitAttempt}
            onResult={submitAttempt}
            disabled={submitting}
            practiceMode={practiceMode}
          />
        </div>
      </div>
    </div>
  );
}
