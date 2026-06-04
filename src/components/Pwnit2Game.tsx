"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  pwnit2DemoCampaign,
  type Pwnit2CampaignSnapshot,
  type Pwnit2LeaderboardEntry,
} from "@/lib/pwnit2DemoCampaign";

type Round = {
  prompt: string;
  answer: number;
  options: number[];
};

type ScoreSaveState = "idle" | "saving" | "saved" | "error";

type ScorePayload = {
  ok: boolean;
  campaign?: Pwnit2CampaignSnapshot;
  leaderboard?: Pwnit2LeaderboardEntry[];
  myRank?: number | null;
  discountEarnedZAR?: number;
  creditsSpent?: number;
  needCredits?: boolean;
  playCostCredits?: number;
  error?: string;
};

const rounds: Round[] = [
  { prompt: "Start at 12. Add 8, then subtract 5.", answer: 15, options: [13, 15, 17, 20] },
  { prompt: "Start at 7. Double it, then add 6.", answer: 20, options: [18, 20, 22, 24] },
  { prompt: "Start at 30. Divide by 3, then add 9.", answer: 19, options: [17, 18, 19, 21] },
  { prompt: "Start at 11. Add 14, then subtract 7.", answer: 18, options: [16, 18, 21, 25] },
  { prompt: "Start at 6. Triple it, then subtract 4.", answer: 14, options: [12, 14, 16, 18] },
];

const STORAGE_KEY = "pwnit2-number-chain-best";

// Measure a real network round-trip so the server's anti-cheat flag has a latency signal.
async function measureRttMs(): Promise<number> {
  try {
    const t0 = performance.now();
    await fetch("/api/game/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    });
    return Math.max(0, Math.round(performance.now() - t0));
  } catch {
    return 0;
  }
}

export default function Pwnit2Game() {
  const [campaign, setCampaign] = useState<Pwnit2CampaignSnapshot>(pwnit2DemoCampaign);
  const [balance, setBalance] = useState<number | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<ScoreSaveState>("idle");
  const [rank, setRank] = useState<number | null>(null);
  const [discountEarned, setDiscountEarned] = useState<number | null>(null);
  const [needCredits, setNeedCredits] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshBalance() {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (data?.ok) setBalance(Number(data.totalCredits ?? 0));
    } catch {
      // non-fatal
    }
  }

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed)) setBestScore(parsed);
    }

    fetch("/api/pwnit-2/campaign", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data?.campaign) setCampaign(data.campaign);
      })
      .catch(() => undefined);

    refreshBalance();
  }, []);

  const elapsedSeconds = useMemo(() => {
    if (!startedAt) return 0;
    const end = finishedAt ?? Date.now();
    return Math.max(0, Math.round((end - startedAt) / 1000));
  }, [finishedAt, startedAt]);

  const score = useMemo(() => {
    if (!finishedAt) return null;
    const speedBonus = Math.max(0, 300 - elapsedSeconds * 5);
    return correct * 160 + speedBonus;
  }, [correct, elapsedSeconds, finishedAt]);

  // Device-local best, shown as a convenience only — the leaderboard/rank is the source of record.
  useEffect(() => {
    if (score === null) return;
    const nextBest = Math.max(bestScore ?? 0, score);
    setBestScore(nextBest);
    window.localStorage.setItem(STORAGE_KEY, String(nextBest));
  }, [bestScore, score]);

  useEffect(() => {
    if (score === null || submittedScore === score) return;
    let cancelled = false;

    async function saveScore() {
      setSaveState("saving");
      setError(null);
      setNeedCredits(false);
      try {
        const rttMs = await measureRttMs();
        const res = await fetch("/api/pwnit-2/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score, elapsedSeconds, correct, total: rounds.length, rttMs }),
        });
        const data = (await res.json()) as ScorePayload;
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setSaveState("error");
          setSubmittedScore(score); // don't auto-retry a charge
          if (data.needCredits || res.status === 402) {
            setNeedCredits(true);
            setError(
              `You need ${data.playCostCredits ?? campaign.playCostCredits ?? 5} credits to play this round.`,
            );
          } else {
            setError(data.error || "Score could not be saved.");
          }
          if (data.campaign) setCampaign(data.campaign);
          return;
        }
        if (data.campaign) setCampaign(data.campaign);
        setRank(data.myRank ?? null);
        setDiscountEarned(Number(data.discountEarnedZAR ?? 0));
        setSaveState("saved");
        setSubmittedScore(score);
        refreshBalance();
      } catch {
        if (!cancelled) {
          setSaveState("error");
          setError("Score could not be saved. Please try again.");
        }
      }
    }

    saveScore();
    return () => {
      cancelled = true;
    };
  }, [correct, elapsedSeconds, score, submittedScore, campaign.playCostCredits]);

  const currentRound = rounds[roundIndex];
  const isFinished = finishedAt !== null;
  const progressPct = Math.round((roundIndex / rounds.length) * 100);
  const playClosed = campaign.state === "STATUS_WINDOW" || campaign.state === "ARCHIVED";
  const playCost = campaign.playCostCredits ?? 5;
  const currentValue = campaign.currentValueZAR ?? 500;

  function startGame() {
    setRoundIndex(0);
    setCorrect(0);
    setStartedAt(Date.now());
    setFinishedAt(null);
    setSelected(null);
    setSaveState("idle");
    setSubmittedScore(null);
    setRank(null);
    setDiscountEarned(null);
    setNeedCredits(false);
    setError(null);
  }

  function chooseOption(value: number) {
    if (!startedAt || isFinished || selected !== null) return;
    setSelected(value);

    const wasCorrect = value === currentRound.answer;
    const nextCorrect = correct + (wasCorrect ? 1 : 0);
    setCorrect(nextCorrect);

    window.setTimeout(() => {
      const nextRound = roundIndex + 1;
      if (nextRound >= rounds.length) {
        setFinishedAt(Date.now());
      } else {
        setRoundIndex(nextRound);
        setSelected(null);
      }
    }, 450);
  }

  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl space-y-5">
        <div className="rounded-[2rem] border border-[#e6ded9] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">{campaign.title}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">{campaign.gameTitle}</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                Solve each number chain quickly and accurately. Each round costs R{playCost} — and every R1
                you spend becomes R1 of discount on this voucher (now R{currentValue}).
              </p>
            </div>
            <Link
              href="/pwnit-2/leaderboard"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800"
            >
              Leaderboard
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold">
            <span className="rounded-full border border-[#e6ded9] bg-[#fffaf8] px-3 py-1.5 text-slate-700">
              Your credits: {balance === null ? "…" : `R${balance}`}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800">
              Your discount: R{campaign.yourDiscountZAR ?? 0}
            </span>
            <Link href="/buy-credits" className="rounded-full bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700">
              Add credits
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#e6ded9] bg-white p-5 shadow-sm sm:p-6">
          {playClosed ? (
            <div className="space-y-5 text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Campaign closed</p>
              <h2 className="text-3xl font-black">This board is frozen.</h2>
              <p className="text-sm font-semibold leading-6 text-slate-700">
                See the result and, if you didn&apos;t win, buy the voucher with your discount.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/pwnit-2/result"
                  className="inline-flex rounded-full bg-[#0f172a] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]"
                >
                  View result
                </Link>
                <Link
                  href="/pwnit-2/purchase"
                  className="inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  Buy the voucher
                </Link>
              </div>
            </div>
          ) : !startedAt ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-3xl font-black text-white">
                5
              </div>
              <div>
                <h2 className="text-2xl font-black">Five quick chains</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Pick the correct result for each chain. A clean, fast run gets the strongest score. This
                  round costs R{playCost}.
                </p>
              </div>
              <button
                onClick={startGame}
                className="rounded-full bg-[#0f172a] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]"
              >
                Start round · R{playCost}
              </button>
            </div>
          ) : isFinished ? (
            <div className="space-y-5 text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Round complete</p>
              <h2 className="text-4xl font-black">{score} points</h2>
              <p className="text-sm font-semibold text-slate-700">
                {correct}/{rounds.length} correct · {elapsedSeconds}s elapsed · Best on this device: {bestScore ?? score}
              </p>

              {needCredits ? (
                <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-bold leading-6 text-emerald-900">
                    {error} Add credits to record this run and earn discount.
                  </p>
                  <Link
                    href="/buy-credits"
                    className="inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    Add credits
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#f3faf7] p-4 text-sm font-bold leading-6 text-slate-700">
                  {saveState === "saving"
                    ? "Saving your score…"
                    : saveState === "saved"
                      ? `Score saved${rank ? ` · rank #${rank}` : ""}${
                          discountEarned ? ` · +R${discountEarned} discount earned` : ""
                        }.`
                      : saveState === "error"
                        ? error
                        : "Ready."}
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={startGame}
                  className="rounded-full bg-[#0f172a] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]"
                >
                  Play again · R{playCost}
                </button>
                <Link
                  href="/pwnit-2/leaderboard"
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-black text-emerald-800 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  View leaderboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Question {roundIndex + 1} of {rounds.length}
                  </p>
                  <h2 className="mt-2 text-2xl font-black">{currentRound.prompt}</h2>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Correct</p>
                  <p className="text-2xl font-black text-emerald-700">{correct}</p>
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-[#e8efe9]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {currentRound.options.map((option) => {
                  const isSelected = selected === option;
                  const isCorrect = option === currentRound.answer;
                  const feedbackClass =
                    selected === null
                      ? "border-[#e6ded9] bg-[#fffaf8] hover:border-emerald-300 hover:bg-emerald-50"
                      : isSelected && isCorrect
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : isSelected
                          ? "border-slate-300 bg-slate-50 text-slate-500"
                          : "border-[#e6ded9] bg-white text-slate-400";

                  return (
                    <button
                      key={option}
                      onClick={() => chooseOption(option)}
                      disabled={selected !== null}
                      className={`rounded-2xl border p-5 text-left text-2xl font-black transition ${feedbackClass}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
