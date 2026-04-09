
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import TurnstileWidget from "@/components/TurnstileWidget";
import AlphabetSprintGame from "@/games/alphabet-sprint/AlphabetSprintGame";
import BalanceGridGame from "@/games/balance-grid/BalanceGridGame";
import CodebreakerGame from "@/games/codebreaker/CodebreakerGame";
import FlashCountGame from "@/games/flash-count/FlashCountGame";
import HiddenPairMemoryGame from "@/games/hidden-pair-memory/HiddenPairMemoryGame";
import MovingZoneGame from "@/games/moving-zone/MovingZoneGame";
import NumberMemoryGame from "@/games/number-memory/NumberMemoryGame";
import PatternMatchGame from "@/games/pattern-match/PatternMatchGame";
import ProgressiveMosaicGame from "@/games/progressive-mosaic/ProgressiveMosaicGame";
import RapidMathRelayGame from "@/games/rapid-math-relay/RapidMathRelayGame";
import QuickStopGame from "@/games/quick-stop/QuickStopGame";
import RouteBuilderGame from "@/games/route-builder/RouteBuilderGame";
import RuleLockGame from "@/games/rule-lock/RuleLockGame";
import ClueLadderGame from "@/games/clue-ladder/ClueLadderGame";
import SequenceRestoreGame from "@/games/sequence-restore/SequenceRestoreGame";
import SpotTheMissingGame from "@/games/spot-the-missing/SpotTheMissingGame";
import TargetGridGame from "@/games/target-grid/TargetGridGame";
import TransformMemoryGame from "@/games/transform-memory/TransformMemoryGame";
import SafePathFogGame from "@/games/safe-path-fog/SafePathFogGame";
import SignalHuntGame from "@/games/signal-hunt/SignalHuntGame";

const VERIFIED_GAME_KEYS = new Set([
  "codebreaker",
  "hidden-pair-memory",
  "rule-lock",
  "transform-memory",
  "sequence-restore",
  "balance-grid",
  "pattern-match",
  "spot-the-missing",
  "rapid-math-relay",
  "progressive-mosaic",
  "clue-ladder",
  "safe-path-fog",
  "signal-hunt",
]);

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let recaptchaScriptPromise: Promise<void> | null = null;

function ensureRecaptchaScript(siteKey: string) {
  if (typeof window === "undefined") return Promise.resolve();
  if (!siteKey) return Promise.resolve();
  if (window.grecaptcha) return Promise.resolve();
  if (recaptchaScriptPromise) return recaptchaScriptPromise;

  recaptchaScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-pwnit-recaptcha="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load reCAPTCHA.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.pwnitRecaptcha = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load reCAPTCHA."));
    document.head.appendChild(script);
  });

  return recaptchaScriptPromise;
}

async function executeRecaptcha(siteKey: string, action: string) {
  if (!siteKey) return null;
  await ensureRecaptchaScript(siteKey);
  return await new Promise<string | null>((resolve) => {
    if (!window.grecaptcha) {
      resolve(null);
      return;
    }
    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha!.execute(siteKey, { action });
        resolve(token || null);
      } catch {
        resolve(null);
      }
    });
  });
}

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
  | "tap-pattern"
  | "route-builder"
  | "codebreaker"
  | "hidden-pair-memory"
  | "rule-lock"
  | "transform-memory"
  | "sequence-restore"
  | "balance-grid"
  | "pattern-match"
  | "spot-the-missing"
  | "rapid-math-relay"
  | "progressive-mosaic"
  | "clue-ladder"
  | "safe-path-fog"
  | "signal-hunt";

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
  "route-builder": { title: "Route Builder", Component: RouteBuilderGame },
  "codebreaker": { title: "Codebreaker", Component: CodebreakerGame },
  "hidden-pair-memory": { title: "Hidden Pair Memory", Component: HiddenPairMemoryGame },
  "rule-lock": { title: "Rule Lock", Component: RuleLockGame },
  "transform-memory": { title: "Transform Memory", Component: TransformMemoryGame },
  "sequence-restore": { title: "Sequence Restore", Component: SequenceRestoreGame },
  "balance-grid": { title: "Balance Grid", Component: BalanceGridGame },
  "pattern-match": { title: "Pattern Match", Component: PatternMatchGame },
  "spot-the-missing": { title: "Spot the Missing", Component: SpotTheMissingGame },
  "rapid-math-relay": { title: "Rapid Math Relay", Component: RapidMathRelayGame },
  "progressive-mosaic": { title: "Progressive Mosaic", Component: ProgressiveMosaicGame },
  "clue-ladder": { title: "Clue Ladder", Component: ClueLadderGame },
  "safe-path-fog": { title: "Safe Path Fog", Component: SafePathFogGame },
  "signal-hunt": { title: "Signal Hunt", Component: SignalHuntGame },
};

type Props = {
  itemId: string;
  gameKey: GameKey;
  playCost: number;
  credits: number;
};

type AttemptSession = {
  attemptId: string;
  challenge: any;
  expiresAt: string;
};

function isRegisteredGameKey(value: unknown): value is GameKey {
  return typeof value === "string" && value in GAME_REGISTRY;
}

function ConfettiOverlay({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="relative rounded-3xl border border-slate-200 bg-slate-50 p-3">
      <ConfettiOverlay show={status?.state === "LEADING"} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Game</div>
          <h2 className="mt-1 text-lg font-black text-slate-950">{entry?.title ?? "Preparing game..."}</h2>
        </div>

        <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={practiceMode}
            onChange={(e: any) => {
              const nextPractice = e.target.checked;
              setPracticeMode(nextPractice);
              setErrMsg(null);
              setResult(null);
              setReviewMsg(null);
              if (nextPractice) setSession(null);
            }}
            className="h-4 w-4 rounded border-slate-300"
            disabled={!canPay || submitting || loadingSession}
          />
          Practice
        </label>
      </div>

      {!supportsVerifiedMode ? (
        <div className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
          <div className="font-semibold">Legacy competitive game detected.</div>
          <div className="mt-1">
            Competitive submissions are blocked for legacy client-scored games. Use a server-verified game key first.
          </div>
        </div>
      ) : null}

      {!canPay ? (
        <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <div className="font-semibold">Not enough credits to submit a score.</div>
          <div className="mt-1">Practice is enabled until you top up.</div>
        </div>
      ) : null}

      {!practiceMode && supportsVerifiedMode ? (
        <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">Verified competitive run</div>
          <div className="mt-1">
            {loadingSession
              ? "Requesting a server-issued challenge..."
              : session
                ? "Challenge locked to this run. Hidden-state games reveal only as you play."
                : "No active verified run yet."}
          </div>
        </div>
      ) : null}

      {turnstileNeeded && TURNSTILE_SITE_KEY ? (
        <div className="mt-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-3 text-sm text-indigo-900">
          <div className="font-semibold">Human check required</div>
          <div className="mt-1">
            {turnstileReason === "first_competitive_play"
              ? "Complete the human check before your first competitive attempt."
              : "Complete the human check to continue. We noticed unusually rapid competitive start behaviour."}
          </div>
          <div className="mt-2">
            <TurnstileWidget
              siteKey={TURNSTILE_SITE_KEY}
              action="competitive_start"
              className="min-h-[65px]"
              onVerify={(token) => {
                setErrMsg(null);
                void issueSession(token);
              }}
              onExpire={() => undefined}
              onError={(message) => setErrMsg(message)}
            />
          </div>
        </div>
      ) : null}

      {status ? (
        <div className="mt-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-900">
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
        <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
          <div className="font-semibold">{practiceMode ? "Practice result" : "Server-verified result"}</div>
          <div className="mt-1">Score {result.scoreMs}</div>
        </div>
      ) : null}

      {reviewMsg ? (
        <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <div className="font-semibold">Review safeguard active</div>
          <div className="mt-1">{reviewMsg}</div>
        </div>
      ) : null}

      {errMsg ? (
        <div className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
          <div className="font-semibold">Couldn’t continue</div>
          <div className="mt-1">{errMsg}</div>
        </div>
      ) : null}

      <div className="mt-3">
        {!practiceMode && supportsVerifiedMode && !session ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-600">
            {loadingSession ? "Preparing your server-issued hidden-state challenge..." : "Preparing your game..."}
          </div>
        ) : Game ? (
          <Game
            disabled={verifiedGameDisabled}
            challenge={mergedChallenge}
            onFinish={(r: { scoreMs: number; meta?: any }) => submitAttempt({ scoreMs: r.scoreMs, meta: r.meta })}
          />
        ) : (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-center text-sm text-amber-800">
            We couldn’t prepare this game right now. Please go back and try again.
          </div>
        )}
      </div>
    </div>
  );
}
