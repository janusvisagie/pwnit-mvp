"use client";

import { useRef, useState } from "react";

import type { GameProps } from "../types";

type ChallengeRound = {
  prompt: string;
  answer?: number;
};

type Challenge = {
  game?: "rapid-math-relay";
  rounds: ChallengeRound[];
  timeLimitMs: number;
  attemptId?: string;
};

const MAX_SCORE = 24000;
const ROUND_COUNT = 6;
const DEFAULT_TIME_LIMIT_MS = 45000;

function randomQuestion(): Required<ChallengeRound> {
  const roll = Math.random();
  if (roll < 0.4) {
    const left = 6 + Math.floor(Math.random() * 25);
    const right = 4 + Math.floor(Math.random() * 17);
    return { prompt: `${left} + ${right}`, answer: left + right };
  }
  if (roll < 0.75) {
    const left = 15 + Math.floor(Math.random() * 46);
    const right = 3 + Math.floor(Math.random() * Math.min(24, left - 1));
    return { prompt: `${left} - ${right}`, answer: left - right };
  }
  const left = 3 + Math.floor(Math.random() * 10);
  const right = 2 + Math.floor(Math.random() * 11);
  return { prompt: `${left} × ${right}`, answer: left * right };
}

function buildChallenge(): Challenge {
  return {
    game: "rapid-math-relay",
    rounds: Array.from({ length: ROUND_COUNT }, () => randomQuestion()),
    timeLimitMs: DEFAULT_TIME_LIMIT_MS,
  };
}

export default function RapidMathRelayGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const [localChallenge, setLocalChallenge] = useState<Challenge>(() => buildChallenge());
  const challenge = injectedChallenge ?? localChallenge;
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const totalRounds = challenge.rounds.length;
  const currentRound = challenge.rounds[index];

  function start() {
    if (disabled) return;
    if (!verifiedMode && phase === "DONE") {
      setLocalChallenge(buildChallenge());
    }
    setPhase("RUNNING");
    setIndex(0);
    setAnswers([]);
    setDraft("");
    setScore(null);
    setMessage("Answer each question in order. Accuracy matters first, then speed.");
    startedAtRef.current = Date.now();
  }

  function finish(finalAnswers: string[]) {
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const expected = challenge.rounds.map((round) => (typeof round.answer === "number" ? String(round.answer) : null));
    const correctCount = expected.every((value) => value != null)
      ? finalAnswers.reduce((count, value, idx) => count + (value === expected[idx] ? 1 : 0), 0)
      : 0;
    const wrongCount = finalAnswers.length - correctCount;
    const speedBonus = Math.max(0, 12000 - elapsedMs);
    const localScore = Math.max(0, Math.min(MAX_SCORE, correctCount * 2800 + speedBonus - wrongCount * 1000));

    setPhase("DONE");
    setScore(localScore);
    setMessage(correctCount === totalRounds ? "Relay complete." : `Relay complete. ${correctCount}/${totalRounds} correct.`);

    onFinish({
      scoreMs: localScore,
      meta: {
        game: "rapid-math-relay",
        answers: finalAnswers,
        elapsedMs,
        answeredCount: finalAnswers.length,
      },
    });
  }

  function submitCurrent() {
    if (disabled || phase !== "RUNNING" || !currentRound) return;
    if (!draft.trim()) {
      setMessage("Type an answer before you move on.");
      return;
    }
    const nextAnswers = [...answers, draft.trim()];
    if (index + 1 >= totalRounds) {
      finish(nextAnswers);
      return;
    }
    setAnswers(nextAnswers);
    setIndex((value) => value + 1);
    setDraft("");
    setMessage(`Nice. ${index + 1}/${totalRounds} answered.`);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Objective</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">Rapid Math Relay</h3>
            <p className="mt-2 text-sm text-slate-600">
              Start the run, solve each mini equation in order, then finish the relay with the strongest mix of accuracy and speed.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-900 px-3 py-2 text-right text-white">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Progress</div>
            <div className="text-lg font-black">
              {phase === "READY" ? "0" : Math.min(index + (phase === "DONE" ? 1 : 0), totalRounds)}/{totalRounds}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Questions</div>
            <div className="mt-1 text-lg font-black text-slate-900">{totalRounds}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Time limit</div>
            <div className="mt-1 text-lg font-black text-slate-900">{Math.round(challenge.timeLimitMs / 1000)}s</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Scoring</div>
            <div className="mt-1 text-sm font-bold text-slate-900">Accuracy first, then speed</div>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
          {phase === "READY" ? (
            <>
              <p className="text-sm font-medium text-slate-600">Tap start to begin the relay.</p>
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Question {Math.min(index + 1, totalRounds)}</p>
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
                    {index + 1 >= totalRounds ? "Finish relay" : "Next question"}
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

        {message ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
            {message}
          </div>
        ) : null}

        {score != null ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
            Score {score.toLocaleString("en-ZA")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
