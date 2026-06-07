"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  generateRound,
  PWNIT2_PUZZLE_CONFIG,
  type Pwnit2PuzzleConfig,
} from "@/lib/pwnit2Puzzle";
import { pwnit2DemoCampaign, type Pwnit2CampaignSnapshot } from "@/lib/pwnit2DemoCampaign";

type Phase = "idle" | "loading" | "playing" | "finished";
type SaveState = "idle" | "saving" | "saved" | "error";

const STORAGE_KEY = "pwnit2-ladder-best";

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
  const [bestRounds, setBestRounds] = useState<number | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [seed, setSeed] = useState<number | null>(null);
  const [config, setConfig] = useState<Pwnit2PuzzleConfig>(PWNIT2_PUZZLE_CONFIG);
  const [roundIndex, setRoundIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [serverCleared, setServerCleared] = useState<number | null>(null);
  const [discountEarned, setDiscountEarned] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [needCredits, setNeedCredits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for values read inside timers/callbacks (avoid stale closures).
  const tokenRef = useRef<string | null>(null);
  const answersRef = useRef<Array<number | null>>([]);
  const gameStartedRef = useRef<number | null>(null);
  const lockRef = useRef(false); // true during answer-feedback window
  const finishedRef = useRef(false);

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
      if (Number.isFinite(parsed)) setBestRounds(parsed);
    }
    fetch("/api/pwnit-2/campaign", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data?.campaign) setCampaign(data.campaign);
      })
      .catch(() => undefined);
    refreshBalance();
  }, []);

  const round = useMemo(() => {
    if (seed === null || phase !== "playing") return null;
    return generateRound(seed, roundIndex, config);
  }, [seed, roundIndex, phase, config]);

  // Per-round countdown. Times out -> end the run (no answer recorded for this round).
  useEffect(() => {
    if (phase !== "playing" || !round) return;
    const deadline = Date.now() + round.timeLimitMs;
    setTimeLeftMs(round.timeLimitMs);
    const id = window.setInterval(() => {
      const rem = deadline - Date.now();
      setTimeLeftMs(Math.max(0, rem));
      if (rem <= 0) {
        window.clearInterval(id);
        if (!lockRef.current && !finishedRef.current) finishGame();
      }
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundIndex, round]);

  const playClosed = campaign.state === "STATUS_WINDOW" || campaign.state === "ARCHIVED";
  const playCost = campaign.playCostCredits ?? 5;
  const currentValue = campaign.currentValueZAR ?? 500;

  async function startGame() {
    setPhase("loading");
    setError(null);
    setNeedCredits(false);
    setSaveState("idle");
    setServerCleared(null);
    setDiscountEarned(null);
    setRank(null);
    finishedRef.current = false;
    lockRef.current = false;
    try {
      const res = await fetch("/api/pwnit-2/play", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.token) {
        setPhase("idle");
        setError(data?.error || "Could not start a game. Please try again.");
        return;
      }
      tokenRef.current = String(data.token);
      setSeed(Number(data.seed));
      if (data.config) setConfig(data.config as Pwnit2PuzzleConfig);
      answersRef.current = [];
      setAnswers([]);
      setSelected(null);
      setRoundIndex(0);
      gameStartedRef.current = Date.now();
      setPhase("playing");
    } catch {
      setPhase("idle");
      setError("Could not start a game. Please try again.");
    }
  }

  function advance() {
    const next = roundIndex + 1;
    if (next >= config.maxRounds) {
      finishGame();
    } else {
      setRoundIndex(next);
    }
  }

  function chooseOption(option: number) {
    if (phase !== "playing" || lockRef.current || !round) return;
    lockRef.current = true;
    setSelected(option);
    answersRef.current[roundIndex] = option;
    setAnswers(answersRef.current.slice());
    const wasCorrect = option === round.answer;
    window.setTimeout(() => {
      setSelected(null);
      lockRef.current = false;
      if (finishedRef.current) return;
      if (wasCorrect) advance();
      else finishGame();
    }, 360);
  }

  async function finishGame() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase("finished");
    setSaveState("saving");
    setNeedCredits(false);
    setError(null);

    const rttMs = await measureRttMs();
    const elapsedMs = Date.now() - (gameStartedRef.current ?? Date.now());
    try {
      const res = await fetch("/api/pwnit-2/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenRef.current, answers: answersRef.current, elapsedMs, rttMs }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSaveState("error");
        if (data?.needCredits || res.status === 402) {
          setNeedCredits(true);
          setError(`You need ${data?.playCostCredits ?? playCost} credits to play.`);
        } else {
          setError(data?.error || "Score could not be saved.");
        }
        if (data?.campaign) setCampaign(data.campaign);
        return;
      }
      const cleared = Number(data.roundsCleared ?? 0);
      setServerCleared(cleared);
      setDiscountEarned(Number(data.discountEarnedZAR ?? 0));
      setRank(data.myRank ?? null);
      if (data.campaign) setCampaign(data.campaign);
      setSaveState("saved");
      const nextBest = Math.max(bestRounds ?? 0, cleared);
      setBestRounds(nextBest);
      window.localStorage.setItem(STORAGE_KEY, String(nextBest));
      refreshBalance();
    } catch {
      setSaveState("error");
      setError("Score could not be saved. Please try again.");
    }
  }

  const timerPct = round ? Math.max(0, Math.min(100, Math.round((timeLeftMs / round.timeLimitMs) * 100))) : 0;

  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl space-y-5">
        <div className="rounded-[2rem] border border-[#e6ded9] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">{campaign.title}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Number Chain Sprint</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                Solve each chain before the timer runs out. One wrong answer ends the run — the further you
                get, the higher you place. Each game costs R{playCost}, and every R1 you spend becomes R1 off
                this voucher (now R{currentValue}).
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
          ) : phase === "idle" ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl font-black text-white">
                ∞
              </div>
              <div>
                <h2 className="text-2xl font-black">How far can you go?</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  The chains start easy and get harder. Keep solving — one wrong answer (or running out of
                  time) ends the run.
                </p>
                {bestRounds ? (
                  <p className="mt-2 text-xs font-bold text-slate-500">Your best on this device: {bestRounds} rounds</p>
                ) : null}
              </div>
              {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
              <button
                onClick={startGame}
                className="rounded-full bg-[#0f172a] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]"
              >
                Start round · R{playCost}
              </button>
            </div>
          ) : phase === "loading" ? (
            <div className="py-10 text-center text-sm font-bold text-slate-500">Starting your round…</div>
          ) : phase === "playing" && round ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Round {roundIndex + 1}</p>
                  <h2 className="mt-2 text-2xl font-black">{round.prompt}</h2>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Cleared</p>
                  <p className="text-2xl font-black text-emerald-700">{roundIndex}</p>
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-[#e8efe9]">
                <div
                  className={`h-full rounded-full transition-[width] duration-100 ${
                    timerPct > 33 ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-amber-400"
                  }`}
                  style={{ width: `${timerPct}%` }}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {round.options.map((option) => {
                  const isSelected = selected === option;
                  const isAnswer = option === round.answer;
                  const feedbackClass =
                    selected === null
                      ? "border-[#e6ded9] bg-[#fffaf8] hover:border-emerald-300 hover:bg-emerald-50"
                      : isAnswer
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
          ) : phase === "finished" ? (
            <div className="space-y-5 text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Run complete</p>
              <h2 className="text-4xl font-black">
                {serverCleared ?? roundIndex} {(serverCleared ?? roundIndex) === 1 ? "round" : "rounds"} cleared
              </h2>
              <p className="text-sm font-semibold text-slate-700">Your best on this device: {bestRounds ?? serverCleared ?? roundIndex} rounds</p>

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
                    ? "Saving your run…"
                    : saveState === "saved"
                      ? `Run saved${rank ? ` · rank #${rank}` : ""}${
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
          ) : null}
        </div>
      </section>
    </main>
  );
}
