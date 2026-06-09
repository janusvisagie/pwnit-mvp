"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  disciplineForRound,
  memorySequence,
  searchTargets,
  searchCount,
  mathProblems,
  inputTimeMsForRound,
  PWNIT2_GAUNTLET_CONFIG,
  type Pwnit2GauntletConfig,
  type Pwnit2MathProblem,
} from "@/lib/pwnit2Gauntlet";
import { pwnit2DemoCampaign, type Pwnit2CampaignSnapshot } from "@/lib/pwnit2DemoCampaign";

type Phase = "idle" | "loading" | "memShow" | "memInput" | "searchInput" | "mathInput" | "finished";
type SaveState = "idle" | "saving" | "saved" | "error";

const STORAGE_PREFIX = "pwnit2-gauntlet-best:";

const PADS = [
  { base: "bg-emerald-200", active: "bg-emerald-500", ring: "ring-emerald-300" },
  { base: "bg-teal-200", active: "bg-teal-500", ring: "ring-teal-300" },
  { base: "bg-sky-200", active: "bg-sky-500", ring: "ring-sky-300" },
  { base: "bg-amber-200", active: "bg-amber-500", ring: "ring-amber-300" },
];

async function measureRttMs(): Promise<number> {
  try {
    const t0 = performance.now();
    await fetch("/api/game/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", cache: "no-store" });
    return Math.max(0, Math.round(performance.now() - t0));
  } catch {
    return 0;
  }
}

export default function Pwnit2Game({ slug = "hero" }: { slug?: string }) {
  const campaignSlug = slug === "staple" ? "staple" : "hero";

  const [campaign, setCampaign] = useState<Pwnit2CampaignSnapshot>(pwnit2DemoCampaign);
  const [balance, setBalance] = useState<number | null>(null);
  const [bestRounds, setBestRounds] = useState<number | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [config, setConfig] = useState<Pwnit2GauntletConfig>(PWNIT2_GAUNTLET_CONFIG);
  const [roundIndex, setRoundIndex] = useState(0);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [tapFlash, setTapFlash] = useState<number | null>(null);
  const [inputCount, setInputCount] = useState(0);
  const [searchTick, setSearchTick] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [serverCleared, setServerCleared] = useState<number | null>(null);
  const [discountEarned, setDiscountEarned] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [needCredits, setNeedCredits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenRef = useRef<string | null>(null);
  const seedRef = useRef<number | null>(null);
  const configRef = useRef<Pwnit2GauntletConfig>(PWNIT2_GAUNTLET_CONFIG);
  const roundsRef = useRef<number[][]>([]);
  const currentTapsRef = useRef<number[]>([]);
  const roundSeqRef = useRef<number[]>([]); // memory: the sequence to flash/repeat
  const roundTargetsRef = useRef<number[]>([]); // search: cells in label order (idx 0 = "1")
  const roundProblemsRef = useRef<Pwnit2MathProblem[]>([]); // math: problems for the round
  const gameStartedRef = useRef<number | null>(null);
  const inputDeadlineRef = useRef<number>(0);
  const finishedRef = useRef(false);
  const resolvingRef = useRef(false);

  const storageKey = `${STORAGE_PREFIX}${campaignSlug}`;

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
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed)) setBestRounds(parsed);
    }
    fetch(`/api/pwnit-2/campaign?item=${campaignSlug}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data?.campaign) setCampaign(data.campaign);
      })
      .catch(() => undefined);
    refreshBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignSlug]);

  // Memory show phase: flash the sequence, then hand to input.
  useEffect(() => {
    if (phase !== "memShow") return;
    const seq = roundSeqRef.current;
    const timers: number[] = [];
    let i = 0;
    setActivePad(null);
    const step = () => {
      if (i >= seq.length) {
        const done = window.setTimeout(() => startMemInput(), 350);
        timers.push(done);
        return;
      }
      setActivePad(seq[i]);
      const on = window.setTimeout(() => {
        setActivePad(null);
        const off = window.setTimeout(() => {
          i += 1;
          step();
        }, configRef.current.memGapMs);
        timers.push(off);
      }, configRef.current.memFlashMs);
      timers.push(on);
    };
    const kickoff = window.setTimeout(step, 500);
    timers.push(kickoff);
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundIndex]);

  // Input countdown for both disciplines.
  useEffect(() => {
    if (phase !== "memInput" && phase !== "searchInput" && phase !== "mathInput") return;
    const deadline = inputDeadlineRef.current;
    setTimeLeftMs(Math.max(0, deadline - Date.now()));
    const id = window.setInterval(() => {
      const rem = deadline - Date.now();
      setTimeLeftMs(Math.max(0, rem));
      if (rem <= 0) {
        window.clearInterval(id);
        if (!resolvingRef.current && !finishedRef.current) endRound(false);
      }
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundIndex]);

  function beginRound(i: number) {
    currentTapsRef.current = [];
    resolvingRef.current = false;
    setInputCount(0);
    setActivePad(null);
    const seed = seedRef.current as number;
    const d = disciplineForRound(i);
    if (d === "memory") {
      roundSeqRef.current = memorySequence(seed, i, configRef.current);
      roundTargetsRef.current = [];
      roundProblemsRef.current = [];
      setPhase("memShow");
    } else if (d === "search") {
      roundTargetsRef.current = searchTargets(seed, i, configRef.current);
      roundSeqRef.current = [];
      roundProblemsRef.current = [];
      inputDeadlineRef.current = Date.now() + inputTimeMsForRound(i, configRef.current);
      setSearchTick((t) => t + 1);
      setPhase("searchInput");
    } else {
      roundProblemsRef.current = mathProblems(seed, i, configRef.current);
      roundSeqRef.current = [];
      roundTargetsRef.current = [];
      setSubIndex(0);
      inputDeadlineRef.current = Date.now() + inputTimeMsForRound(i, configRef.current);
      setPhase("mathInput");
    }
  }

  function startMemInput() {
    resolvingRef.current = false;
    inputDeadlineRef.current = Date.now() + inputTimeMsForRound(roundIndex, configRef.current);
    setPhase("memInput");
  }

  function endRound(cleared: boolean) {
    if (resolvingRef.current || finishedRef.current) return;
    resolvingRef.current = true;
    roundsRef.current[roundIndex] = currentTapsRef.current.slice();
    if (cleared) {
      const next = roundIndex + 1;
      if (next >= configRef.current.maxRounds) {
        finishGame();
      } else {
        setRoundIndex(next);
        beginRound(next);
      }
    } else {
      finishGame();
    }
  }

  function chooseMemPad(pad: number) {
    if (phase !== "memInput" || resolvingRef.current || finishedRef.current) return;
    const seq = roundSeqRef.current;
    const expected = seq[currentTapsRef.current.length];
    setTapFlash(pad);
    window.setTimeout(() => setTapFlash(null), 170);
    currentTapsRef.current.push(pad);
    setInputCount(currentTapsRef.current.length);
    if (pad !== expected) {
      endRound(false);
      return;
    }
    if (currentTapsRef.current.length >= seq.length) endRound(true);
  }

  function chooseSearchCell(cell: number) {
    if (phase !== "searchInput" || resolvingRef.current || finishedRef.current) return;
    const targets = roundTargetsRef.current;
    const expected = targets[currentTapsRef.current.length];
    currentTapsRef.current.push(cell);
    setInputCount(currentTapsRef.current.length);
    setSearchTick((t) => t + 1);
    if (cell !== expected) {
      endRound(false);
      return;
    }
    if (currentTapsRef.current.length >= targets.length) endRound(true);
  }

  function chooseMathOption(idx: number) {
    if (phase !== "mathInput" || resolvingRef.current || finishedRef.current) return;
    const probs = roundProblemsRef.current;
    const expected = probs[currentTapsRef.current.length]?.correct;
    currentTapsRef.current.push(idx);
    setSubIndex(currentTapsRef.current.length);
    if (idx !== expected) {
      endRound(false);
      return;
    }
    if (currentTapsRef.current.length >= probs.length) endRound(true);
  }

  async function finishGame() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    resolvingRef.current = true;
    setActivePad(null);
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
        body: JSON.stringify({ token: tokenRef.current, slug: campaignSlug, rounds: roundsRef.current, elapsedMs, rttMs }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSaveState("error");
        if (data?.needCredits || res.status === 402) {
          setNeedCredits(true);
          setError(`You need ${data?.playCostCredits ?? campaign.playCostCredits ?? 5} credits to play.`);
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
      window.localStorage.setItem(storageKey, String(nextBest));
      refreshBalance();
    } catch {
      setSaveState("error");
      setError("Score could not be saved. Please try again.");
    }
  }

  async function startGame() {
    setPhase("loading");
    setError(null);
    setNeedCredits(false);
    setSaveState("idle");
    setServerCleared(null);
    setDiscountEarned(null);
    setRank(null);
    finishedRef.current = false;
    resolvingRef.current = false;
    roundsRef.current = [];
    currentTapsRef.current = [];
    try {
      const res = await fetch(`/api/pwnit-2/play?item=${campaignSlug}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.token) {
        setPhase("idle");
        setError(data?.error || "Could not start a game. Please try again.");
        return;
      }
      tokenRef.current = String(data.token);
      seedRef.current = Number(data.seed);
      const cfg = (data.config as Pwnit2GauntletConfig) ?? PWNIT2_GAUNTLET_CONFIG;
      configRef.current = cfg;
      setConfig(cfg);
      setRoundIndex(0);
      gameStartedRef.current = Date.now();
      beginRound(0);
    } catch {
      setPhase("idle");
      setError("Could not start a game. Please try again.");
    }
  }

  const playClosed = campaign.state === "STATUS_WINDOW" || campaign.state === "ARCHIVED";
  const playCost = campaign.playCostCredits ?? 5;
  const currentValue = campaign.currentValueZAR ?? 0;
  const q = `?item=${campaignSlug}`;
  const discipline = disciplineForRound(roundIndex);
  const inputPct =
    phase === "memInput" || phase === "searchInput" || phase === "mathInput"
      ? Math.max(0, Math.min(100, Math.round((timeLeftMs / inputTimeMsForRound(roundIndex, config)) * 100)))
      : 100;

  // search render helpers
  const targets = roundTargetsRef.current;
  const labelByCell: Record<number, number> = {};
  targets.forEach((cellIdx, p) => {
    labelByCell[cellIdx] = p + 1;
  });
  const totalCells = config.gridCols * config.gridRows;
  const tappedSet = new Set(currentTapsRef.current);

  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl space-y-5">
        <div className="rounded-[2rem] border border-[#e6ded9] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">{campaign.title}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">PwnIt Gauntlet</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                Two games, one run: memorise the colour pattern, then race to tap the numbers in order. Clear as
                many rounds as you can. Each run costs R{playCost}, and every R1 you spend becomes R1 off this
                voucher{currentValue ? ` (now R${currentValue})` : ""}.
              </p>
            </div>
            <Link href={`/pwnit-2/leaderboard${q}`} className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
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
                <Link href={`/pwnit-2/result${q}`} className="inline-flex rounded-full bg-[#0f172a] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]">
                  View result
                </Link>
                <Link href={`/pwnit-2/purchase${q}`} className="inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700">
                  Buy the voucher
                </Link>
              </div>
            </div>
          ) : phase === "idle" ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex max-w-md items-stretch justify-center gap-2.5">
                <div className="grid flex-1 grid-cols-2 gap-1.5 rounded-2xl border border-[#e6ded9] p-2">
                  {PADS.map((p, i) => (
                    <div key={i} className={`h-9 rounded-xl ${p.base}`} />
                  ))}
                </div>
                <div className="grid flex-1 grid-cols-3 content-center gap-1.5 rounded-2xl border border-[#e6ded9] p-2">
                  {[3, 1, 5, 2, 4, 6].map((n) => (
                    <div key={n} className="flex h-7 items-center justify-center rounded-md bg-emerald-50 text-xs font-black text-emerald-700">
                      {n}
                    </div>
                  ))}
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#e6ded9] p-2">
                  <span className="text-sm font-black text-slate-800">7 × 8</span>
                  <div className="grid grid-cols-2 gap-1">
                    {[54, 56, 49, 63].map((n) => (
                      <div key={n} className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black text-emerald-700">
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black">Three games, one run</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  It rotates: watch a colour sequence and tap it back, then find and tap the numbers in order,
                  then answer quick maths. Each round adds difficulty — how far can you get?
                </p>
                {bestRounds ? <p className="mt-2 text-xs font-bold text-slate-500">Your best on this device: {bestRounds} rounds</p> : null}
              </div>
              {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
              <button onClick={startGame} className="rounded-full bg-[#0f172a] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]">
                Start run · R{playCost}
              </button>
            </div>
          ) : phase === "loading" ? (
            <div className="py-10 text-center text-sm font-bold text-slate-500">Starting your run…</div>
          ) : phase === "finished" ? (
            <div className="space-y-5 text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Run complete</p>
              <h2 className="text-4xl font-black">
                {serverCleared ?? roundIndex} {(serverCleared ?? roundIndex) === 1 ? "round" : "rounds"} cleared
              </h2>
              <p className="text-sm font-semibold text-slate-700">Your best on this device: {bestRounds ?? serverCleared ?? roundIndex} rounds</p>

              {needCredits ? (
                <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-bold leading-6 text-emerald-900">{error} Add credits to record this run and earn discount.</p>
                  <Link href="/buy-credits" className="inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700">
                    Add credits
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#f3faf7] p-4 text-sm font-bold leading-6 text-slate-700">
                  {saveState === "saving"
                    ? "Saving your run…"
                    : saveState === "saved"
                      ? `Run saved${rank ? ` · rank #${rank}` : ""}${discountEarned ? ` · +R${discountEarned} discount earned` : ""}.`
                      : saveState === "error"
                        ? error
                        : "Ready."}
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={startGame} className="rounded-full bg-[#0f172a] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]">
                  Play again · R{playCost}
                </button>
                <Link href={`/pwnit-2/leaderboard${q}`} className="rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-black text-emerald-800 transition hover:-translate-y-0.5 hover:bg-white">
                  View leaderboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Round {roundIndex + 1} · {discipline === "memory" ? "Memory" : discipline === "search" ? "Find the numbers" : "Quick maths"}
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    {phase === "memShow"
                      ? "Watch the sequence"
                      : phase === "memInput"
                        ? "Repeat the sequence"
                        : phase === "searchInput"
                          ? `Tap 1 → ${searchCount(roundIndex, config)} in order`
                          : "Solve the problems"}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-slate-600">
                    {phase === "memInput"
                      ? `${inputCount} / ${roundSeqRef.current.length} tapped`
                      : phase === "searchInput"
                        ? `${inputCount} / ${targets.length} found`
                        : phase === "mathInput"
                          ? `Problem ${Math.min(subIndex + 1, Math.max(1, roundProblemsRef.current.length))} / ${roundProblemsRef.current.length}`
                          : `${roundSeqRef.current.length} in the sequence`}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Cleared</p>
                  <p className="text-2xl font-black text-emerald-700">{roundIndex}</p>
                </div>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-[#e8efe9]">
                <div
                  className={`h-full rounded-full transition-[width] duration-100 ${inputPct > 33 ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-amber-400"}`}
                  style={{ width: phase === "memInput" || phase === "searchInput" || phase === "mathInput" ? `${inputPct}%` : "100%" }}
                />
              </div>

              {discipline === "memory" ? (
                <div className="mx-auto grid max-w-sm grid-cols-2 gap-3">
                  {PADS.map((p, i) => {
                    const lit = (phase === "memShow" && activePad === i) || tapFlash === i;
                    return (
                      <button
                        key={i}
                        onClick={() => chooseMemPad(i)}
                        disabled={phase !== "memInput"}
                        aria-label={`Pad ${i + 1}`}
                        className={`h-28 rounded-3xl ring-2 transition-all duration-150 sm:h-32 ${
                          lit ? `${p.active} scale-[1.03] ${p.ring}` : `${p.base} ring-transparent`
                        } ${phase === "memInput" ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"}`}
                      />
                    );
                  })}
                </div>
              ) : discipline === "search" ? (
                <div
                  data-tick={searchTick}
                  className="mx-auto grid max-w-md gap-2"
                  style={{ gridTemplateColumns: `repeat(${config.gridCols}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: totalCells }, (_, c) => {
                    const label = labelByCell[c];
                    const done = tappedSet.has(c);
                    if (!label) {
                      return <div key={c} className="aspect-square rounded-xl border border-dashed border-[#ece4de] bg-[#fcf8f5]" />;
                    }
                    return (
                      <button
                        key={c}
                        onClick={() => chooseSearchCell(c)}
                        disabled={done}
                        aria-label={`Number ${label}`}
                        className={`aspect-square rounded-xl text-lg font-black transition-all duration-100 sm:text-xl ${
                          done
                            ? "bg-emerald-500 text-white"
                            : "border border-emerald-200 bg-white text-emerald-800 hover:-translate-y-0.5 hover:bg-emerald-50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mx-auto max-w-md space-y-4">
                  <div className="rounded-3xl border border-emerald-200 bg-[#f3faf7] px-6 py-8 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                      Problem {Math.min(subIndex + 1, Math.max(1, roundProblemsRef.current.length))} / {roundProblemsRef.current.length}
                    </p>
                    <p className="mt-2 text-5xl font-black tracking-tight text-slate-950">
                      {roundProblemsRef.current[subIndex]?.text ?? ""} <span className="text-emerald-600">= ?</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(roundProblemsRef.current[subIndex]?.options ?? []).map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => chooseMathOption(oi)}
                        disabled={phase !== "mathInput"}
                        aria-label={`Answer ${opt}`}
                        className="rounded-2xl border border-emerald-200 bg-white py-5 text-2xl font-black text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-center text-xs font-semibold text-slate-500">
                {phase === "memShow"
                  ? "Memorise the order…"
                  : phase === "memInput"
                    ? "Tap the pads in the order they lit up."
                    : phase === "searchInput"
                      ? "Tap the numbers in ascending order. One wrong tap ends the run."
                      : "Tap the correct answer. One wrong answer ends the run."}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
