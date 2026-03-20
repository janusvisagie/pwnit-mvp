"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AlphabetSprintGame from "@/games/alphabet-sprint/AlphabetSprintGame";
import FlashCountGame from "@/games/flash-count/FlashCountGame";
import MovingZoneGame from "@/games/moving-zone/MovingZoneGame";
import NumberMemoryGame from "@/games/number-memory/NumberMemoryGame";
import QuickStopGame from "@/games/quick-stop/QuickStopGame";
import TargetGridGame from "@/games/target-grid/TargetGridGame";

type GameKey =
  | "memory-sprint"
  | "quick-stop"
  | "moving-zone"
  | "trace-run"
  | "flash-count"
  | "target-grid"
  | "alphabet-sprint"
  | "number-memory"
  | "precision-timer"
  | "rhythm-hold"
  | "tap-speed"
  | "target-hold"
  | "stop-zero"
  | "tap-pattern";

const GAME_REGISTRY: Record<GameKey, { title: string; Component: any }> = {
  "memory-sprint": { title: "Memory Sprint", Component: NumberMemoryGame },
  "quick-stop": { title: "Quick Stop", Component: QuickStopGame },
  "moving-zone": { title: "Moving Zone Hold", Component: MovingZoneGame },
  "trace-run": { title: "Alphabet Sprint", Component: AlphabetSprintGame },
  "flash-count": { title: "Flash Count", Component: FlashCountGame },
  "target-grid": { title: "Target Grid", Component: TargetGridGame },
  "alphabet-sprint": { title: "Alphabet Sprint", Component: AlphabetSprintGame },
  "number-memory": { title: "Memory Sprint", Component: NumberMemoryGame },
  "precision-timer": { title: "Quick Stop", Component: QuickStopGame },
  "rhythm-hold": { title: "Moving Zone Hold", Component: MovingZoneGame },
  "tap-speed": { title: "Flash Count", Component: FlashCountGame },
  "target-hold": { title: "Target Grid", Component: TargetGridGame },
  "stop-zero": { title: "Quick Stop", Component: QuickStopGame },
  "tap-pattern": { title: "Flash Count", Component: FlashCountGame },
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      {Array.from({ length: 24 }).map((_, i) => {
        const left = (i * 100) / 24;
        const delay = (i % 6) * 0.05;
        const size = 6 + (i % 4) * 2;

        return (
          <span
            key={i}
            className="absolute top-0 animate-bounce rounded-full opacity-80"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * 1.6}px`,
              animationDelay: `${delay}s`,
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
  const [practiceMode, setPracticeMode] = useState(!canPay);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ scoreMs: number } | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<{ myRank: number; totalPlayers: number; state: "LEADING" | "BONUS" | "CHASING" } | null>(null);

  const entry = GAME_REGISTRY[gameKey] ?? GAME_REGISTRY["quick-stop"];
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

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json")
        ? await res.json().catch(() => null)
        : { ok: false, error: await res.text().catch(() => "Non-JSON error") };

      if (!res.ok || !data?.ok) {
        setErrMsg(data?.error || `Submit failed (${res.status})`);
        return;
      }

      setResult({ scoreMs: payload.scoreMs });
      setStatus({
        myRank: Number(data.myRank || 0),
        totalPlayers: Number(data.totalPlayers || 0),
        state: (data.status || "CHASING") as any,
      });

      window.dispatchEvent(new Event("pwnit:credits"));
      router.refresh();
    } catch (e: any) {
      setErrMsg(e?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <ConfettiOverlay show={status?.state === "LEADING"} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Game</div>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{entry.title}</h2>
        </div>

        <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={practiceMode}
            onChange={(e) => setPracticeMode(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
            disabled={!canPay || submitting}
          />
          Practice
        </label>
      </div>

      {!canPay ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="font-semibold">Not enough credits to submit a score.</div>
          <div className="mt-1">Practice is enabled until you top up.</div>
        </div>
      ) : null}

      {status ? (
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <div className="font-semibold">
            Current standing: #{status.myRank} / {status.totalPlayers}
          </div>
          <div className="mt-1">1st place wins the prize. 2nd and 3rd earn credit bonuses.</div>
          {status.state === "LEADING" ? (
            <div className="mt-1 font-medium">You’re currently in first place.</div>
          ) : status.state === "BONUS" ? (
            <div className="mt-1 font-medium">You’re in a bonus position.</div>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="font-semibold">{practiceMode ? "Practice result" : "Submitted"}</div>
          <div className="mt-1">Score {result.scoreMs}</div>
        </div>
      ) : null}

      {errMsg ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="font-semibold">Couldn’t submit your score</div>
          <div className="mt-1">{errMsg}</div>
        </div>
      ) : null}

      <div className="mt-5">
        <Game onFinish={(r: { scoreMs: number; meta?: any }) => submitAttempt({ scoreMs: r.scoreMs, meta: r.meta })} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900"
          onClick={() => router.push(`/item/${itemId}/leaderboard`)}
          disabled={submitting}
        >
          View leaderboard
        </button>

        <button
          type="button"
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900"
          onClick={() => router.push(`/item/${itemId}`)}
          disabled={submitting}
        >
          Back to item
        </button>
      </div>
    </div>
  );
}
