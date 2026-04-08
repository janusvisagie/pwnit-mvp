"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

type ChallengeRound = {
  prompt: string;
  answer?: number;
};

type Challenge = {
  game?: "rapid-math-relay";
  rounds: ChallengeRound[];
  timeLimitMs: number;
};

const MAX_SCORE = 24000;
const PRACTICE_BASE_TIME_MS = 7500;
const PRACTICE_MIN_TIME_MS = 2600;

function randomQuestion(level = 1): Required<ChallengeRound> {
  const difficulty = Math.max(1, level);
  const roll = Math.random();
  if (roll < 0.34) {
    const left = 8 + Math.floor(Math.random() * (20 + difficulty * 3));
    const right = 4 + Math.floor(Math.random() * (12 + difficulty * 2));
    return { prompt: `${left} + ${right}`, answer: left + right };
  }
  if (roll < 0.68) {
    const left = 18 + Math.floor(Math.random() * (32 + difficulty * 3));
    const right = 3 + Math.floor(Math.random() * Math.max(8, Math.min(20 + difficulty, left - 2)));
    return { prompt: `${left} - ${right}`, answer: left - right };
  }
  const left = 2 + Math.floor(Math.random() * Math.min(14, 4 + difficulty));
  const right = 3 + Math.floor(Math.random() * Math.min(13, 5 + difficulty));
  return { prompt: `${left} × ${right}`, answer: left * right };
}

function buildChallenge(level = 1): Challenge {
  return {
    game: "rapid-math-relay",
    rounds: Array.from({ length: 6 }, (_, index) => randomQuestion(level + index)),
    timeLimitMs: 45000,
  };
}

export default function RapidMathRelayGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const verifiedMode = Boolean(injectedChallenge);
  const [level, setLevel] = useState(1);
  const [localChallenge, setLocalChallenge] = useState<Challenge>(() => buildChallenge(1));
  const challenge = useMemo(() => injectedChallenge ?? localChallenge, [injectedChallenge, localChallenge]);
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [runScore, setRunScore] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const endsAtRef = useRef<number | null>(null);

  const totalRounds = challenge.rounds.length;
  const currentRound = challenge.rounds[index];
  const practiceQuestionTimeMs = Math.max(PRACTICE_MIN_TIME_MS, PRACTICE_BASE_TIME_MS - (level - 1) * 350);

  useEffect(() => {
    if (!verifiedMode) return;
    setPhase("READY");
    setIndex(0);
    setAnswers([]);
    setDraft("");
    setMessage(null);
    setRunScore(0);
    setFinalScore(null);
    setRemainingMs(null);
  }, [injectedChallenge, verifiedMode]);

  useEffect(() => {
    if (phase !== "RUNNING" || endsAtRef.current == null) return undefined;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, endsAtRef.current! - Date.now());
      setRemainingMs(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        if (verifiedMode) {
          finishVerified([...answers, ...(draft.trim() ? [draft.trim()] : []), ...Array.from({ length: Math.max(0, totalRounds - answers.length - (draft.trim() ? 1 : 0)) }, () => "")], "Time up.");
        } else {
          finishPractice(false, "Time up.");
        }
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [phase, verifiedMode, answers, draft, totalRounds]);

  function startPracticeRound(nextLevel: number, nextRunScore: number) {
    const nextChallenge = buildChallenge(nextLevel);
    setLocalChallenge(nextChallenge);
    setLevel(nextLevel);
    setRunScore(nextRunScore);
    setPhase("RUNNING");
    setIndex(0);
    setAnswers([]);
    setDraft("");
    setFinalScore(null);
    setMessage("Solve the sequence. One wrong answer or a timeout ends the run.");
    startedAtRef.current = Date.now();
    endsAtRef.current = Date.now() + practiceQuestionTimeMs;
    setRemainingMs(practiceQuestionTimeMs);
  }

  function startVerified() {
    setPhase("RUNNING");
    setIndex(0);
    setAnswers([]);
    setDraft("");
    setMessage("Solve the relay before the timer expires.");
    setFinalScore(null);
    startedAtRef.current = Date.now();
    endsAtRef.current = Date.now() + challenge.timeLimitMs;
    setRemainingMs(challenge.timeLimitMs);
  }

  function start() {
    if (disabled) return;
    if (verifiedMode) {
      startVerified();
      return;
    }
    startPracticeRound(1, 0);
  }

  function finishVerified(finalAnswers: string[], customMessage?: string) {
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const normalized = finalAnswers.slice(0, totalRounds);
    while (normalized.length < totalRounds) normalized.push("");
    const expected = challenge.rounds.map((round) => String(round.answer ?? ""));
    const correctCount = normalized.reduce((count, value, idx) => count + (value === expected[idx] ? 1 : 0), 0);
    const wrongCount = totalRounds - correctCount;
    const speedBonus = Math.max(0, 12000 - elapsedMs);
    const scoreMs = Math.max(0, Math.min(MAX_SCORE, correctCount * 2800 + speedBonus - wrongCount * 1000));

    setPhase("DONE");
    setFinalScore(scoreMs);
    setRemainingMs(0);
    setMessage(customMessage ?? (correctCount === totalRounds ? "Relay complete." : `Relay complete. ${correctCount}/${totalRounds} correct.`));

    onFinish({
      scoreMs,
      meta: {
        game: "rapid-math-relay",
        answers: normalized,
        elapsedMs,
        answeredCount: normalized.filter(Boolean).length,
      },
    });
  }

  function finishPractice(correct: boolean, customMessage?: string) {
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    if (!correct) {
      setPhase("DONE");
      setFinalScore(runScore);
      setRemainingMs(0);
      setMessage(customMessage ?? `Run over. You cleared ${Math.max(0, level - 1)} level${level - 1 === 1 ? "" : "s"}.`);
      onFinish({
        scoreMs: runScore,
        meta: {
          game: "rapid-math-relay",
          roundsCleared: Math.max(0, level - 1),
          levelReached: level,
          elapsedMs,
        },
      });
      return;
    }

    const roundScore = Math.max(900, 7600 - elapsedMs - (level - 1) * 180);
    const nextRunScore = runScore + roundScore;
    startPracticeRound(level + 1, nextRunScore);
    setMessage(`Correct. Level ${level + 1} begins now.`);
  }

  function submitCurrent() {
    if (disabled || phase !== "RUNNING" || !currentRound) return;
    if (!draft.trim()) {
      setMessage("Type an answer before you move on.");
      return;
    }
    const answer = draft.trim();

    if (verifiedMode) {
      const nextAnswers = [...answers, answer];
      if (index + 1 >= totalRounds) {
        finishVerified(nextAnswers);
        return;
      }
      setAnswers(nextAnswers);
      setIndex((value) => value + 1);
      setDraft("");
      setMessage(`Nice. ${index + 1}/${totalRounds} answered.`);
      return;
    }

    const expected = String(currentRound.answer ?? "");
    if (answer !== expected) {
      finishPractice(false, `Wrong answer. The correct answer was ${expected}.`);
      return;
    }

    finishPractice(true);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Objective</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">Rapid Math Relay</h3>
            <p className="mt-2 text-sm text-slate-600">
              Solve the current prompt before the timer expires. Practice mode keeps climbing in difficulty until you make a mistake. Competitive mode scores the full relay within the fixed time window.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-900 px-3 py-2 text-right text-white">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Progress</div>
            <div className="text-lg font-black">
              {verifiedMode ? `${phase === "READY" ? 0 : Math.min(index + (phase === "DONE" ? 1 : 0), totalRounds)}/${totalRounds}` : `L${level}`}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Mode</div>
            <div className="mt-1 text-lg font-black text-slate-900">{verifiedMode ? "Relay" : "Endless"}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Time</div>
            <div className="mt-1 text-lg font-black text-slate-900">
              {remainingMs != null ? `${Math.max(0, Math.ceil(remainingMs / 1000))}s` : verifiedMode ? `${Math.round(challenge.timeLimitMs / 1000)}s` : `${Math.round(practiceQuestionTimeMs / 1000)}s`}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Scoring</div>
            <div className="mt-1 text-sm font-bold text-slate-900">Accuracy first, then speed</div>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
          {phase === "READY" ? (
            <>
              <p className="text-sm font-medium text-slate-600">Tap start to begin.</p>
              <button
                type="button"
                onClick={start}
                disabled={disabled}
                className="mt-4 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Start rapid math relay
              </button>
            </>
          ) : currentRound ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {verifiedMode ? `Question ${Math.min(index + 1, totalRounds)}` : `Level ${level}`}
              </p>
              <div className="mt-2 text-4xl font-black tracking-tight text-slate-900">{currentRound.prompt}</div>
              {phase === "RUNNING" ? (
                <div className="mx-auto mt-5 max-w-xs">
                  <input
                    inputMode="numeric"
                    autoFocus
                    value={draft}
                    onChange={(event) => setDraft(event.target.value.replace(/[^0-9\-]/g, ""))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        submitCurrent();
                      }
                    }}
                    disabled={disabled}
                    placeholder="Answer"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-xl font-black text-slate-900 outline-none transition focus:border-slate-900"
                  />
                  <button
                    type="button"
                    onClick={submitCurrent}
                    disabled={disabled}
                    className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {verifiedMode ? (index + 1 >= totalRounds ? "Finish relay" : "Next question") : "Submit answer"}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        {answers.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            Answers logged: {answers.join(", ")}
          </div>
        ) : null}

        {!verifiedMode ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
            Run score {runScore.toLocaleString("en-ZA")}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
            {message}
          </div>
        ) : null}

        {finalScore != null ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
            Score {finalScore.toLocaleString("en-ZA")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
