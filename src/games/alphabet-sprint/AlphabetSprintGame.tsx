"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "../types";

type PromptDef = {
  letter: string;
  clue: string;
  accepted: string[];
};

const PROMPTS: PromptDef[] = [
  { letter: "A", clue: "Name a fruit that starts with A.", accepted: ["apple", "apricot", "avocado", "ackee"] },
  { letter: "B", clue: "Name an animal that starts with B.", accepted: ["bear", "baboon", "beaver", "buffalo", "bat", "bee", "badger", "bison", "butterfly"] },
  { letter: "C", clue: "Name a country that starts with C.", accepted: ["canada", "chile", "china", "cuba", "colombia", "croatia", "cambodia", "cyprus", "cameroon", "chad", "congo", "costarica"] },
  { letter: "D", clue: "Name a job that starts with D.", accepted: ["doctor", "dentist", "driver", "designer", "developer", "dancer", "detective", "diver"] },
  { letter: "E", clue: "Name an animal that starts with E.", accepted: ["elephant", "eagle", "eel", "emu", "earthworm", "elk"] },
  { letter: "F", clue: "Name a food that starts with F.", accepted: ["fries", "fish", "falafel", "feta", "fig", "fondue"] },
  { letter: "G", clue: "Name an animal that starts with G.", accepted: ["giraffe", "goat", "gorilla", "goose", "gazelle", "gecko"] },
  { letter: "H", clue: "Name a household item that starts with H.", accepted: ["hammer", "hanger", "hairdryer", "headphones", "helmet", "heater", "hose"] },
  { letter: "I", clue: "Name a country that starts with I.", accepted: ["india", "indonesia", "ireland", "iceland", "iran", "iraq", "israel", "italy"] },
  { letter: "J", clue: "Name an animal that starts with J.", accepted: ["jaguar", "jackal", "jellyfish", "jay"] },
  { letter: "K", clue: "Name a food that starts with K.", accepted: ["kiwi", "kale", "kebab", "kimchi", "ketchup", "kidneybeans"] },
  { letter: "L", clue: "Name a food that starts with L.", accepted: ["lemon", "lime", "lasagna", "lentils", "lollipop", "lettuce"] },
  { letter: "M", clue: "Name a job that starts with M.", accepted: ["mechanic", "manager", "miner", "musician", "marketer", "mason", "model"] },
  { letter: "N", clue: "Name an animal that starts with N.", accepted: ["narwhal", "newt", "nightingale"] },
  { letter: "O", clue: "Name a food that starts with O.", accepted: ["orange", "olive", "oats", "omelette", "onion", "okra"] },
  { letter: "P", clue: "Name a country that starts with P.", accepted: ["peru", "poland", "portugal", "pakistan", "panama", "paraguay", "philippines"] },
  { letter: "Q", clue: "Name an object that starts with Q.", accepted: ["quilt", "quill"] },
  { letter: "R", clue: "Name an animal that starts with R.", accepted: ["rabbit", "raccoon", "rhino", "raven", "robin", "rat", "reindeer"] },
  { letter: "S", clue: "Name a food that starts with S.", accepted: ["sandwich", "spaghetti", "salad", "soup", "sushi", "steak"] },
  { letter: "T", clue: "Name a job that starts with T.", accepted: ["teacher", "tailor", "technician", "therapist", "trainer", "translator"] },
  { letter: "U", clue: "Name a country that starts with U.", accepted: ["uganda", "ukraine", "uruguay", "uzbekistan", "unitedarabemirates", "unitedkingdom", "unitedstates"] },
  { letter: "V", clue: "Name an animal that starts with V.", accepted: ["vulture", "viper", "vole"] },
  { letter: "W", clue: "Name a household item that starts with W.", accepted: ["wallet", "watch", "whisk", "window", "wardrobe", "wheelbarrow", "wire"] },
  { letter: "X", clue: "Name a musical instrument that starts with X.", accepted: ["xylophone"] },
  { letter: "Y", clue: "Name a food that starts with Y.", accepted: ["yogurt", "yam", "yuzu"] },
  { letter: "Z", clue: "Name an animal that starts with Z.", accepted: ["zebra"] },
];

const COUNTDOWN_FROM = 3;
const BETWEEN_PROMPTS_MS = 450;
const BASE_POINTS = 4000;
const MAX_SPEED_BONUS = 6000;

type Phase = "READY" | "COUNTDOWN" | "PROMPT" | "DONE";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

export default function AlphabetSprintGame({ onFinish, disabled }: GameProps) {
  const [phase, setPhase] = useState<Phase>("READY");
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const [roundIndex, setRoundIndex] = useState(0);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const totalScoreRef = useRef(0);
  const pendingTimerRef = useRef<number | null>(null);

  const current = PROMPTS[roundIndex];
  const progress = useMemo(() => `${Math.min(roundIndex + 1, PROMPTS.length)} / ${PROMPTS.length}`, [roundIndex]);

  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "COUNTDOWN") return;

    if (count <= 1) {
      const t = window.setTimeout(() => {
        setPhase("PROMPT");
        startedAtRef.current = Date.now();
      }, 250);
      pendingTimerRef.current = t;
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(() => setCount((prev) => prev - 1), 650);
    pendingTimerRef.current = t;
    return () => window.clearTimeout(t);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "PROMPT") return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    pendingTimerRef.current = t;
    return () => window.clearTimeout(t);
  }, [phase, roundIndex]);

  function startRun() {
    if (disabled) return;
    totalScoreRef.current = 0;
    setScore(null);
    setMessage(null);
    setCorrectCount(0);
    setRoundIndex(0);
    setValue("");
    setCount(COUNTDOWN_FROM);
    startedAtRef.current = null;
    setPhase("COUNTDOWN");
  }

  function resetRun() {
    totalScoreRef.current = 0;
    setScore(null);
    setMessage(null);
    setCorrectCount(0);
    setRoundIndex(0);
    setValue("");
    setCount(COUNTDOWN_FROM);
    startedAtRef.current = null;
    setPhase("READY");
  }

  function finishRun(finalScore: number, finalMessage: string, totalCorrect: number) {
    setScore(finalScore);
    setMessage(finalMessage);
    setCorrectCount(totalCorrect);
    setPhase("DONE");
    onFinish({
      scoreMs: finalScore,
      meta: { game: "alphabet-sprint", rounds: PROMPTS.length, correctAnswers: totalCorrect },
    });
  }

  function submit() {
    if (disabled || phase !== "PROMPT" || !current) return;

    const cleaned = normalize(value);
    if (!cleaned) return;

    if (!cleaned.startsWith(current.letter.toLowerCase())) {
      finishRun(
        totalScoreRef.current,
        `Wrong starting letter. You needed ${current.letter}.`,
        correctCount
      );
      return;
    }

    const accepted = current.accepted.includes(cleaned);
    if (!accepted) {
      const example = current.accepted[0];
      finishRun(
        totalScoreRef.current,
        `Not accepted for ${current.letter}. One valid answer was ${example}.`,
        correctCount
      );
      return;
    }

    const end = Date.now();
    const startedAt = startedAtRef.current ?? end;
    const elapsed = Math.max(0, end - startedAt);
    const roundScore = BASE_POINTS + Math.max(0, MAX_SPEED_BONUS - elapsed);
    const nextScore = totalScoreRef.current + roundScore;
    totalScoreRef.current = nextScore;

    const nextCorrect = correctCount + 1;
    setCorrectCount(nextCorrect);
    setValue("");

    if (roundIndex >= PROMPTS.length - 1) {
      finishRun(nextScore, "Perfect A–Z run.", nextCorrect);
      return;
    }

    setMessage(`Correct. +${roundScore.toLocaleString("en-ZA")} pts`);
    setPhase("DONE");

    const t = window.setTimeout(() => {
      setMessage(null);
      setRoundIndex((prev) => prev + 1);
      startedAtRef.current = Date.now();
      setPhase("PROMPT");
    }, BETWEEN_PROMPTS_MS);
    pendingTimerRef.current = t;
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">Objective</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">
            Sprint from A to Z by answering each clue with the correct starting letter before the clock cools your score.
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Progress</div>
          <div className="mt-0.5 text-lg font-black tabular-nums text-slate-900">{progress}</div>
        </div>
      </div>

      {phase === "READY" ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 sm:text-[11px]">Alphabet Sprint</div>
          <div className="mt-2 text-sm leading-6 text-slate-700">
            You will get 26 clues, one for every letter from A to Z. Each accepted answer must start with the required letter. A wrong answer ends the run.
          </div>
          <button
            onClick={startRun}
            disabled={disabled}
            className={[
              "mt-4 inline-flex min-h-[44px] items-center justify-center rounded-2xl px-5 py-3 text-sm font-extrabold shadow-sm transition",
              disabled ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800",
            ].join(" ")}
          >
            Start alphabet sprint
          </button>
        </div>
      ) : phase === "COUNTDOWN" ? (
        <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-center text-white shadow-sm sm:rounded-[28px] sm:p-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 sm:text-[11px]">Get ready</div>
          <div className="mt-3 text-5xl font-black tabular-nums tracking-tight sm:text-6xl">{count}</div>
        </div>
      ) : phase === "PROMPT" && current ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">Current clue</div>
            <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">{current.letter}</div>
          </div>

          <div className="mt-2 text-base font-bold text-slate-900 sm:text-lg">{current.clue}</div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setMessage(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder={`Type an answer starting with ${current.letter}`}
              disabled={disabled}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 outline-none ring-0 transition focus:border-slate-900"
            />
            <button
              onClick={submit}
              disabled={disabled}
              className={[
                "w-full shrink-0 rounded-2xl px-5 py-3 text-sm font-extrabold shadow-sm transition sm:w-auto",
                disabled ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800",
              ].join(" ")}
            >
              Enter
            </button>
          </div>

          {message ? (
            <div className="mt-3 text-sm font-semibold text-emerald-700">{message}</div>
          ) : (
            <div className="mt-3 text-xs text-slate-500">
              Accepted answers are strict so preview testing is predictable. Speed boosts each correct answer.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold ring-1 ring-slate-200">
              Correct so far: {correctCount}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold ring-1 ring-slate-200">
              Score: {totalScoreRef.current.toLocaleString("en-ZA")}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">Run complete</div>
          <div className="mt-2 text-base font-bold text-slate-900 sm:text-lg">{message || "Run finished."}</div>

          {score != null ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                Score: <span className="font-black text-emerald-900">{score.toLocaleString("en-ZA")}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                Correct answers: <span className="font-black text-slate-900">{correctCount}</span> / {PROMPTS.length}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <button
        onClick={resetRun}
        disabled={disabled}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
      >
        Restart alphabet sprint
      </button>
    </div>
  );
}
