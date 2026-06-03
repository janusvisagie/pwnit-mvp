"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { pwnit2DemoCampaign, type Pwnit2CampaignSnapshot, type Pwnit2LeaderboardEntry } from "@/lib/pwnit2DemoCampaign";

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

export default function Pwnit2Game() {
  const [campaign, setCampaign] = useState<Pwnit2CampaignSnapshot>(pwnit2DemoCampaign);
  const [roundIndex, setRoundIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<ScoreSaveState>("idle");
  const [rank, setRank] = useState<number | null>(null);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      try {
        const res = await fetch("/api/pwnit-2/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score, elapsedSeconds, correct, total: rounds.length }),
        });
        const data = (await res.json()) as ScorePayload;
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setSaveState("error");
          setError(data.error || "Score could not be saved.");
          return;
        }
        if (data.campaign) setCampaign(data.campaign);
        setRank(data.myRank ?? null);
        setSaveState("saved");
        setSubmittedScore(score);
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
  }, [correct, elapsedSeconds, score, submittedScore]);

  const currentRound = rounds[roundIndex];
  const isFinished = finishedAt !== null;
  const progressPct = Math.round((roundIndex / rounds.length) * 100);
  const playClosed = campaign.state === "STATUS_WINDOW" || campaign.state === "ARCHIVED";

  function startGame() {
    setRoundIndex(0);
    setCorrect(0);
    setStartedAt(Date.now());
    setFinishedAt(null);
    setSelected(null);
    setSaveState("idle");
    setSubmittedScore(null);
    setRank(null);
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
        <div className="rounded-[2rem] border border-[#ecd8d0] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9f4d3d]">{campaign.title}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">{campaign.gameTitle}</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                Solve each number chain as quickly and accurately as possible. Your score rewards correct answers and speed.
              </p>
            </div>
            <Link href="/pwnit-2/leaderboard" className="rounded-full border border-[#8bd7d0] bg-[#effdfb] px-4 py-2 text-sm font-black text-[#10645c]">
              Leaderboard
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#ecd8d0] bg-white p-5 shadow-sm sm:p-6">
          {playClosed ? (
            <div className="space-y-5 text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9f4d3d]">Campaign closed</p>
              <h2 className="text-3xl font-black">This board is frozen.</h2>
              <p className="text-sm font-semibold leading-6 text-slate-700">Open the status page to view the final campaign result.</p>
              <Link href="/pwnit-2/status" className="inline-flex rounded-full bg-[#0f172a] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]">
                View status
              </Link>
            </div>
          ) : !startedAt ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#14b8a6] to-[#f2a38e] text-3xl font-black text-white">
                5
              </div>
              <div>
                <h2 className="text-2xl font-black">Five quick chains</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">Pick the correct result for each chain. A clean, fast run gets the strongest score.</p>
              </div>
              <button onClick={startGame} className="rounded-full bg-[#0f172a] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]">
                Start round
              </button>
            </div>
          ) : isFinished ? (
            <div className="space-y-5 text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9f4d3d]">Round complete</p>
              <h2 className="text-4xl font-black">{score} points</h2>
              <p className="text-sm font-semibold text-slate-700">
                {correct}/{rounds.length} correct · {elapsedSeconds}s elapsed · Best on this device: {bestScore ?? score}
              </p>
              <p className="rounded-2xl bg-[#fff7f3] p-4 text-sm font-bold leading-6 text-slate-700">
                {saveState === "saving" ? "Saving your score…" : saveState === "saved" ? `Score saved${rank ? ` · current rank #${rank}` : ""}.` : saveState === "error" ? error : "Ready."}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={startGame} className="rounded-full bg-[#0f172a] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]">
                  Play again
                </button>
                <Link href="/pwnit-2/leaderboard" className="rounded-full border border-[#8bd7d0] bg-[#effdfb] px-6 py-3 text-sm font-black text-[#10645c] transition hover:-translate-y-0.5 hover:bg-white">
                  View leaderboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Question {roundIndex + 1} of {rounds.length}</p>
                  <h2 className="mt-2 text-2xl font-black">{currentRound.prompt}</h2>
                </div>
                <div className="rounded-2xl bg-[#effdfb] px-4 py-3 text-right">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#10645c]">Correct</p>
                  <p className="text-2xl font-black text-[#10645c]">{correct}</p>
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-[#f3e5df]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#14b8a6] to-[#f2a38e]" style={{ width: `${progressPct}%` }} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {currentRound.options.map((option) => {
                  const isSelected = selected === option;
                  const isCorrect = option === currentRound.answer;
                  const feedbackClass = selected === null
                    ? "border-[#ecd8d0] bg-[#fffaf8] hover:border-[#8bd7d0] hover:bg-[#effdfb]"
                    : isSelected && isCorrect
                      ? "border-[#8bd7d0] bg-[#effdfb] text-[#10645c]"
                      : isSelected
                        ? "border-[#f3c8bb] bg-[#fff7f3] text-[#9f4d3d]"
                        : "border-[#ecd8d0] bg-white text-slate-400";

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
