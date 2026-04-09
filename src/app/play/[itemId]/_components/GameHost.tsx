"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";

import TurnstileWidget from "@/components/TurnstileWidget";
import AlphabetSprintGame from "@/games/alphabet-sprint/AlphabetSprintGame";
import BalanceGridGame from "@/games/balance-grid/BalanceGridGame";
import ClueLadderGame from "@/games/clue-ladder/ClueLadderGame";
import CodebreakerGame from "@/games/codebreaker/CodebreakerGame";
import FlashCountGame from "@/games/flash-count/FlashCountGame";
import HiddenPairMemoryGame from "@/games/hidden-pair-memory/HiddenPairMemoryGame";
import MovingZoneGame from "@/games/moving-zone/MovingZoneGame";
import NumberMemoryGame from "@/games/number-memory/NumberMemoryGame";
import PatternMatchGame from "@/games/pattern-match/PatternMatchGame";
import ProgressiveMosaicGame from "@/games/progressive-mosaic/ProgressiveMosaicGame";
import QuickStopGame from "@/games/quick-stop/QuickStopGame";
import RapidMathRelayGame from "@/games/rapid-math-relay/RapidMathRelayGame";
import RouteBuilderGame from "@/games/route-builder/RouteBuilderGame";
import RuleLockGame from "@/games/rule-lock/RuleLockGame";
import SafePathFogGame from "@/games/safe-path-fog/SafePathFogGame";
import SequenceRestoreGame from "@/games/sequence-restore/SequenceRestoreGame";
import SignalHuntGame from "@/games/signal-hunt/SignalHuntGame";
import SpotTheMissingGame from "@/games/spot-the-missing/SpotTheMissingGame";
import TargetGridGame from "@/games/target-grid/TargetGridGame";
import TransformMemoryGame from "@/games/transform-memory/TransformMemoryGame";

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

type GameFinishPayload = { scoreMs: number; meta?: any };

type GameComponentProps = {
  disabled?: boolean;
  challenge?: any;
  onFinish: (result: GameFinishPayload) => void;
};

type RegistryEntry = {
  title: string;
  Component: ComponentType<GameComponentProps>;
};

const GAME_REGISTRY: Record<GameKey, RegistryEntry> = {
  "memory-sprint": { title: "Memory Sprint", Component: NumberMemoryGame as ComponentType<GameComponentProps> },
  "quick-stop": { title: "Quick Stop", Component: QuickStopGame as ComponentType<GameComponentProps> },
  "moving-zone": { title: "Moving Zone Hold", Component: MovingZoneGame as ComponentType<GameComponentProps> },
  "trace-run": { title: "Alphabet Sprint", Component: AlphabetSprintGame as ComponentType<GameComponentProps> },
  "flash-count": { title: "Flash Count", Component: FlashCountGame as ComponentType<GameComponentProps> },
  "target-grid": { title: "Target Grid", Component: TargetGridGame as ComponentType<GameComponentProps> },
  "alphabet-sprint": { title: "Alphabet Sprint", Component: AlphabetSprintGame as ComponentType<GameComponentProps> },
  "number-memory": { title: "Memory Sprint", Component: NumberMemoryGame as ComponentType<GameComponentProps> },
  "precision-timer": { title: "Quick Stop", Component: QuickStopGame as ComponentType<GameComponentProps> },
  "rhythm-hold": { title: "Moving Zone Hold", Component: MovingZoneGame as ComponentType<GameComponentProps> },
  "tap-speed": { title: "Flash Count", Component: FlashCountGame as ComponentType<GameComponentProps> },
  "target-hold": { title: "Target Grid", Component: TargetGridGame as ComponentType<GameComponentProps> },
  "stop-zero": { title: "Quick Stop", Component: QuickStopGame as ComponentType<GameComponentProps> },
  "tap-pattern": { title: "Flash Count", Component: FlashCountGame as ComponentType<GameComponentProps> },
  "route-builder": { title: "Route Builder", Component: RouteBuilderGame as ComponentType<GameComponentProps> },
  codebreaker: { title: "Codebreaker", Component: CodebreakerGame as ComponentType<GameComponentProps> },
  "hidden-pair-memory": {
    title: "Hidden Pair Memory",
    Component: HiddenPairMemoryGame as ComponentType<GameComponentProps>,
  },
  "rule-lock": { title: "Rule Lock", Component: RuleLockGame as ComponentType<GameComponentProps> },
  "transform-memory": {
    title: "Transform Memory",
    Component: TransformMemoryGame as ComponentType<GameComponentProps>,
  },
  "sequence-restore": {
    title: "Sequence Restore",
    Component: SequenceRestoreGame as ComponentType<GameComponentProps>,
  },
  "balance-grid": { title: "Balance Grid", Component: BalanceGridGame as ComponentType<GameComponentProps> },
  "pattern-match": { title: "Pattern Match", Component: PatternMatchGame as ComponentType<GameComponentProps> },
  "spot-the-missing": {
    title: "Spot the Missing",
    Component: SpotTheMissingGame as ComponentType<GameComponentProps>,
  },
  "rapid-math-relay": {
    title: "Rapid Math Relay",
    Component: RapidMathRelayGame as ComponentType<GameComponentProps>,
  },
  "progressive-mosaic": {
    title: "Progressive Mosaic",
    Component: ProgressiveMosaicGame as ComponentType<GameComponentProps>,
  },
  "clue-ladder": { title: "Clue Ladder", Component: ClueLadderGame as ComponentType<GameComponentProps> },
  "safe-path-fog": { title: "Safe Path Fog", Component: SafePathFogGame as ComponentType<GameComponentProps> },
  "signal-hunt": { title: "Signal Hunt", Component: SignalHuntGame as ComponentType<GameComponentProps> },
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      {Array.from({ length: 24 }).map((_, i) => {
        const left = `${(i * 100) / 24}%`;
        const delay = `${(i % 6) * 120}ms`;
        const duration = `${1800 + (i % 5) * 160}ms`;
        const size = 6 + (i % 4) * 2;

        return (
          <span
            key={i}
            className="absolute top-0 inline-block animate-[confetti-fall_var(--dur)_linear_infinite] rounded-full bg-sky-400 opacity-80"
            style={{
              left,
              width: size,
              height: size * 1.5,
              animationDelay: delay,
              animationDuration: duration,
              transform: `translateY(-20px) rotate(${i * 17}deg)`,
            }}
          />
        );
      })}

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(420px) rotate(360deg);
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
  const supportsVerifiedMode = VERIFIED_GAME_KEYS.has(gameKey);

  const [practiceMode, setPracticeMode] = useState(!canPay);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [session, setSession] = useState<AttemptSession | null>(null);
  const [result, setResult] = useState<{ scoreMs: number } | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    myRank: number;
    totalPlayers: number;
    state: "LEADING" | "BONUS" | "CHASING";
  } | null>(null);
  const [turnstileNeeded, setTurnstileNeeded] = useState(false);
  const [turnstileReason, setTurnstileReason] = useState<string | null>(null);

  useEffect(() => {
    if (!canPay) {
      setPracticeMode(true);
      setSession(null);
    }
  }, [canPay]);

  useEffect(() => {
    setResult(null);
    setErrMsg(null);
    setReviewMsg(null);
    setStatus(null);
    setSession(null);
    setTurnstileNeeded(false);
    setTurnstileReason(null);
  }, [itemId, gameKey]);

  const resolvedGameKey = useMemo(() => {
    const sessionGame = session?.challenge?.game;
    if (isRegisteredGameKey(sessionGame)) return sessionGame;
    if (isRegisteredGameKey(gameKey)) return gameKey;
    return "quick-stop";
  }, [gameKey, session]);

  const entry = GAME_REGISTRY[resolvedGameKey];
  const Game = entry?.Component ?? null;

  const issueSession = useCallback(
    async (overrideTurnstileToken?: string | null) => {
      if (!canPay || practiceMode || !supportsVerifiedMode) {
        setSession(null);
        return;
      }

      setLoadingSession(true);
      setErrMsg(null);

      try {
        const res = await fetch("/api/attempt/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            itemId,
            turnstileToken: overrideTurnstileToken || undefined,
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          setSession(null);
          if (data?.turnstileRequired) {
            setTurnstileNeeded(true);
            setTurnstileReason(String(data?.reason || "human_check"));
          }
          setErrMsg(data?.error || `Could not start a verified run (${res.status})`);
          return;
        }

        setTurnstileNeeded(false);
        setTurnstileReason(null);
        setSession({
          attemptId: String(data.attemptId),
          challenge: data.challenge,
          expiresAt: String(data.expiresAt),
        });
      } catch (error: any) {
        setSession(null);
        setErrMsg(error?.message || "Could not start a verified run.");
      } finally {
        setLoadingSession(false);
      }
    },
    [canPay, itemId, practiceMode, supportsVerifiedMode],
  );

  useEffect(() => {
    if (!canPay || practiceMode || !supportsVerifiedMode) {
      setSession(null);
      return;
    }
    void issueSession();
  }, [canPay, practiceMode, supportsVerifiedMode, issueSession]);

  async function submitAttempt(payload: GameFinishPayload) {
    if (practiceMode) {
      setResult({ scoreMs: payload.scoreMs });
      setStatus(null);
      setErrMsg(null);
      setReviewMsg(null);
      return;
    }

    if (!supportsVerifiedMode) {
      setErrMsg(
        "This item is still linked to a legacy game in the database. Run the relink script or reseed to attach one of the server-verified game keys.",
      );
      return;
    }

    if (credits < playCost) {
      setErrMsg("Not enough credits to submit. Practice mode only.");
      return;
    }

    if (!session?.attemptId) {
      setErrMsg("No active verified run. Start a fresh run.");
      await issueSession();
      return;
    }

    setSubmitting(true);
    setErrMsg(null);

    try {
      const recaptchaToken = RECAPTCHA_SITE_KEY
        ? await executeRecaptcha(RECAPTCHA_SITE_KEY, "competitive_finish")
        : null;

      const res = await fetch("/api/attempt/finish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attemptId: session.attemptId,
          meta: {
            ...(payload.meta ?? {}),
            recaptchaToken,
          },
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json().catch(() => null)
        : { ok: false, error: await res.text().catch(() => "Non-JSON error") };

      if (!res.ok || !data?.ok) {
        setErrMsg(data?.error || `Submit failed (${res.status})`);
        return;
      }

      const officialScore = Number(data?.officialScore ?? payload.scoreMs ?? 0);
      setResult({ scoreMs: officialScore });
      setStatus({
        myRank: Number(data?.myRank || 0),
        totalPlayers: Number(data?.totalPlayers || 0),
        state: (data?.status || "CHASING") as "LEADING" | "BONUS" | "CHASING",
      });
      setReviewMsg(
        data?.reviewRequired
          ? "Your result was recorded, but winner confirmation may pause for review if suspicious signals are detected near the podium."
          : null,
      );
      setSession(null);

      window.dispatchEvent(new Event("pwnit:credits"));
      router.refresh();
      void issueSession();
    } catch (error: any) {
      setErrMsg(error?.message || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const verifiedGameDisabled =
    submitting || loadingSession || (!practiceMode && supportsVerifiedMode && !session);

  const mergedChallenge = !practiceMode && session
    ? {
        ...(session.challenge ?? {}),
        attemptId: session.attemptId,
        expiresAt: session.expiresAt,
      }
    : undefined;

  return (
    <div className="relative rounded-3xl border border-slate-200 bg-slate-50 p-3">
      <ConfettiOverlay show={status?.state === "LEADING"} />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Game</div>
          <h2 className="mt-1 text-lg font-black text-slate-950">{entry?.title ?? "Preparing game..."}</h2>
        </div>

        <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={practiceMode}
            onChange={(e) => {
              const nextPractice = e.target.checked;
              setPracticeMode(nextPractice);
              setErrMsg(null);
              setResult(null);
              setReviewMsg(null);
              setStatus(null);
              if (nextPractice) setSession(null);
            }}
            className="h-4 w-4 rounded border-slate-300"
            disabled={!canPay || submitting || loadingSession}
          />
          Practice
        </label>
      </div>

      {!supportsVerifiedMode ? (
        <div className="relative z-10 mt-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
          <div className="font-semibold">Legacy competitive game detected.</div>
          <div className="mt-1">
            Competitive submissions are blocked for legacy client-scored games. Use a server-verified game key first.
          </div>
        </div>
      ) : null}

      {!canPay ? (
        <div className="relative z-10 mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <div className="font-semibold">Not enough credits to submit a score.</div>
          <div className="mt-1">Practice is enabled until you top up.</div>
        </div>
      ) : null}

      {!practiceMode && supportsVerifiedMode ? (
        <div className="relative z-10 mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">Verified competitive run</div>
          <div className="mt-1">
            {loadingSession
              ? "Requesting a server-issued challenge..."
              : session
                ? "Challenge locked to this run. Hidden-state games only reveal what the server allows as you play."
                : "No active verified run yet."}
          </div>
        </div>
      ) : null}

      {turnstileNeeded && TURNSTILE_SITE_KEY ? (
        <div className="relative z-10 mt-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-3 text-sm text-indigo-900">
          <div className="font-semibold">Human check required</div>
          <div className="mt-1">
            {turnstileReason === "first_competitive_play"
              ? "Complete the human check before your first competitive attempt."
              : "Complete the human check to continue. We noticed unusually rapid competitive-start behaviour."}
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
        <div className="relative z-10 mt-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-900">
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
        <div className="relative z-10 mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
          <div className="font-semibold">{practiceMode ? "Practice result" : "Server-verified result"}</div>
          <div className="mt-1">Score {result.scoreMs}</div>
        </div>
      ) : null}

      {reviewMsg ? (
        <div className="relative z-10 mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <div className="font-semibold">Review safeguard active</div>
          <div className="mt-1">{reviewMsg}</div>
        </div>
      ) : null}

      {errMsg ? (
        <div className="relative z-10 mt-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
          <div className="font-semibold">Couldn’t continue</div>
          <div className="mt-1">{errMsg}</div>
        </div>
      ) : null}

      <div className="relative z-10 mt-3">
        {!practiceMode && supportsVerifiedMode && !session ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-600">
            {loadingSession ? "Preparing your server-issued hidden-state challenge..." : "Preparing your game..."}
          </div>
        ) : Game ? (
          <Game
            disabled={verifiedGameDisabled}
            challenge={mergedChallenge}
            onFinish={(r) => void submitAttempt({ scoreMs: r.scoreMs, meta: r.meta })}
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
