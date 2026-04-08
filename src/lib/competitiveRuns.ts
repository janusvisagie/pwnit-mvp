export const PROGRESSIVE_RUN_GAME_KEYS = [
  "progressive-mosaic",
  "clue-ladder",
  "spot-the-missing",
  "rapid-math-relay",
] as const;

export type ProgressiveRunGameKey = (typeof PROGRESSIVE_RUN_GAME_KEYS)[number];

export type ChoiceOption = {
  id: string;
  label: string;
  emoji: string;
};

type ProgressiveMosaicTarget = {
  id: string;
  label: string;
  emoji: string;
  reveals: string[];
};

type ClueLadderTarget = {
  id: string;
  label: string;
  emoji: string;
  clues: string[];
};

type ProgressiveMosaicChallenge = {
  game: "progressive-mosaic";
  level: number;
  answerId: string;
  options: ChoiceOption[];
  reveals: string[];
  maxReveals: number;
  timeLimitMs: number;
};

type ClueLadderChallenge = {
  game: "clue-ladder";
  level: number;
  answerId: string;
  options: ChoiceOption[];
  clues: string[];
  totalClues: number;
  timeLimitMs: number;
};

type SpotTheMissingChallenge = {
  game: "spot-the-missing";
  level: number;
  shown: string[];
  remaining: string[];
  missing: string;
  options: string[];
  timeLimitMs: number;
};

type RapidMathRelayChallenge = {
  game: "rapid-math-relay";
  level: number;
  prompt: string;
  answer: number;
  timeLimitMs: number;
};

export type ProgressiveRunServerChallenge =
  | ProgressiveMosaicChallenge
  | ClueLadderChallenge
  | SpotTheMissingChallenge
  | RapidMathRelayChallenge;

export type ProgressiveRunPublicChallenge =
  | (Omit<ProgressiveMosaicChallenge, "answerId" | "reveals"> & { shownReveals: string[] })
  | (Omit<ClueLadderChallenge, "answerId" | "clues"> & { shownClues: string[] })
  | Omit<SpotTheMissingChallenge, "missing">
  | Omit<RapidMathRelayChallenge, "answer">;

export type ProgressiveRunState = {
  mode: "competitive-run";
  game: ProgressiveRunGameKey;
  status: "RUNNING" | "FAILED" | "TIMED_OUT";
  currentLevel: number;
  levelsCleared: number;
  mistakes: number;
  totalElapsedMs: number;
  totalRevealCount: number;
  currentChallenge: ProgressiveRunServerChallenge;
  shownCount: number;
  lastOutcome?: "CLEARED" | "FAILED" | "TIMED_OUT";
  lastLevelElapsedMs?: number;
  finishedReason?: string;
};

type VerificationResult = {
  valid: boolean;
  scoreMs: number;
  flags: Record<string, any>;
};

type ProgressOk = {
  ok: true;
  progressState: ProgressiveRunState;
  data: Record<string, any>;
};

type ProgressErr = {
  ok: false;
  status: number;
  error: string;
};

export type ProgressiveRunProgressResult = ProgressOk | ProgressErr;

const MOSAIC_TARGETS: ProgressiveMosaicTarget[] = [
  { id: "fuel-voucher", label: "Fuel Voucher", emoji: "⛽", reveals: ["⛽", "Road spend", "Refuel at a filling station", "Helps on the road", "Transport-linked spend", "Redeemed when the tank is low"] },
  { id: "checkers-voucher", label: "Checkers Voucher", emoji: "🛒", reveals: ["🛒", "Groceries and essentials", "Used at a supermarket", "Basket and trolley spend", "Household staples", "Redeemed at the till"] },
  { id: "takealot-voucher", label: "Takealot Voucher", emoji: "📦", reveals: ["📦", "Online order", "Delivered to your door", "Shopping from home", "E-commerce spend", "Checkout without a trolley"] },
  { id: "headphones", label: "Headphones", emoji: "🎧", reveals: ["🎧", "Private listening", "Worn over your ears", "Audio without speakers", "Music and focus", "Noise around you fades"] },
  { id: "switch", label: "Nintendo Switch", emoji: "🎮", reveals: ["🎮", "Portable play", "Hybrid console", "Detachable controls", "Docked or handheld", "Gaming on the go"] },
  { id: "camera", label: "GoPro Camera", emoji: "📷", reveals: ["📷", "Adventure footage", "Action capture", "Small rugged camera", "Mounted on gear", "Built for movement"] },
  { id: "bonus-credits", label: "Bonus Credits", emoji: "⭐", reveals: ["⭐", "More tries", "Platform reward", "Keeps you competing", "Extra credit balance", "Not a physical parcel"] },
  { id: "podium-place", label: "Podium Place", emoji: "🏆", reveals: ["🏆", "Top finish", "Leaderboard target", "Bragging rights", "Near the very top", "Where winners stand"] },
];

const CLUE_TARGETS: ClueLadderTarget[] = [
  { id: "fuel-voucher", label: "Fuel Voucher", emoji: "⛽", clues: ["Practical rather than flashy.", "Used during travel.", "Linked to transport cost.", "Redeemed at a filling station.", "Not a gadget.", "Helps before the road trip is over."] },
  { id: "checkers-voucher", label: "Checkers Voucher", emoji: "🛒", clues: ["Household spend rather than entertainment.", "Think essentials.", "Fits a trolley better than a gadget bag.", "Redeemed in-store.", "Useful every week.", "Belongs with groceries and basics."] },
  { id: "takealot-voucher", label: "Takealot Voucher", emoji: "📦", clues: ["Works well from home.", "Convenience and delivery matter.", "Redeemed online, not at a till queue.", "Tied to e-commerce.", "Think checkout and shipment.", "A South African online store gift."] },
  { id: "headphones", label: "Headphones", emoji: "🎧", clues: ["Worn, not carried while used.", "Improves a personal media experience.", "Helps you focus on sound.", "Sits over your ears.", "Good for music and quiet.", "Private listening gear."] },
  { id: "switch", label: "Nintendo Switch", emoji: "🎮", clues: ["Built for play rather than work.", "Moves between handheld and docked use.", "Has detachable controls.", "A hybrid console.", "Portable gaming matters.", "Nintendo made it."] },
  { id: "camera", label: "GoPro Camera", emoji: "📷", clues: ["Captures moments rather than playing them.", "Often used outdoors.", "Good in motion.", "Compact and rugged.", "Mounted on people or gear.", "An action camera."] },
  { id: "bonus-credits", label: "Bonus Credits", emoji: "⭐", clues: ["A platform reward, not a parcel.", "Lets you keep competing.", "Redeemed inside the experience.", "Gives you more tries.", "Not a retailer voucher.", "It extends play rather than shipping."] },
  { id: "podium-place", label: "Podium Place", emoji: "🏆", clues: ["A result rather than a product.", "Linked to rank.", "Near the top of the leaderboard.", "Players chase it.", "Bragging rights matter.", "Winners stand here."] },
];

const WORD_BANK = ["Pick", "Play", "PwnIt", "Prize", "Bonus", "Boost", "Credit", "Target", "Podium", "Voucher", "Unlock", "Winner"] as const;

function shuffle<T>(values: readonly T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function choice<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)]!;
}

function clampInt(value: unknown, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function isChoiceOption(value: unknown): value is ChoiceOption {
  return !!value && typeof value === "object" && typeof (value as ChoiceOption).id === "string";
}

export function isProgressiveRunGameKey(gameKey: string): gameKey is ProgressiveRunGameKey {
  return (PROGRESSIVE_RUN_GAME_KEYS as readonly string[]).includes(gameKey);
}

function buildChoiceOptions<T extends { id: string; label: string; emoji: string }>(source: readonly T[], correctId: string, count: number) {
  const correct = source.find((entry) => entry.id === correctId) ?? choice(source);
  const distractors = shuffle(source.filter((entry) => entry.id !== correct.id)).slice(0, Math.max(0, count - 1));
  return shuffle([correct, ...distractors]).map(({ id, label, emoji }) => ({ id, label, emoji }));
}

function mosaicRevealCount(level: number) {
  return Math.min(6, 4 + Math.floor((level - 1) / 2));
}

function clueCount(level: number) {
  return Math.min(6, 4 + Math.floor((level - 1) / 2));
}

function optionCount(level: number) {
  return Math.min(6, 4 + Math.floor((level - 1) / 2));
}

function buildProgressiveMosaicLevel(level: number): ProgressiveMosaicChallenge {
  const target = choice(MOSAIC_TARGETS);
  const maxReveals = mosaicRevealCount(level);
  const reveals = target.reveals.slice(0, maxReveals);
  return {
    game: "progressive-mosaic",
    level,
    answerId: target.id,
    options: buildChoiceOptions(MOSAIC_TARGETS, target.id, optionCount(level)),
    reveals,
    maxReveals,
    timeLimitMs: Math.max(6000, 16000 - level * 700),
  };
}

function buildClueLadderLevel(level: number): ClueLadderChallenge {
  const target = choice(CLUE_TARGETS);
  const totalClues = clueCount(level);
  return {
    game: "clue-ladder",
    level,
    answerId: target.id,
    options: buildChoiceOptions(CLUE_TARGETS, target.id, optionCount(level)),
    clues: target.clues.slice(0, totalClues),
    totalClues,
    timeLimitMs: Math.max(6500, 16500 - level * 650),
  };
}

function buildSpotTheMissingLevel(level: number): SpotTheMissingChallenge {
  const showCount = Math.min(8, 4 + level);
  const shown = shuffle(WORD_BANK).slice(0, showCount) as string[];
  const missingIndex = Math.floor(Math.random() * shown.length);
  const missing = shown[missingIndex]!;
  const remaining = shown.filter((_, index) => index !== missingIndex);
  const distractorCount = Math.min(5, 2 + Math.floor(level / 2));
  const distractors = shuffle(WORD_BANK.filter((word) => !shown.includes(word))).slice(0, distractorCount) as string[];
  return {
    game: "spot-the-missing",
    level,
    shown,
    remaining,
    missing,
    options: shuffle([missing, ...distractors]),
    timeLimitMs: Math.max(3500, 11000 - level * 450),
  };
}

function buildMathQuestion(level: number): { prompt: string; answer: number } {
  if (level < 3) {
    const left = 4 + Math.floor(Math.random() * 18);
    const right = 3 + Math.floor(Math.random() * 14);
    return { prompt: `${left} + ${right}`, answer: left + right };
  }
  if (level < 6) {
    const left = 18 + Math.floor(Math.random() * 36);
    const right = 4 + Math.floor(Math.random() * Math.min(20, left - 1));
    return { prompt: `${left} - ${right}`, answer: left - right };
  }
  if (level < 9) {
    const left = 3 + Math.floor(Math.random() * 10);
    const right = 2 + Math.floor(Math.random() * 10);
    return { prompt: `${left} × ${right}`, answer: left * right };
  }
  const left = 10 + Math.floor(Math.random() * 40);
  const right = 2 + Math.floor(Math.random() * 10);
  const third = 2 + Math.floor(Math.random() * 8);
  return { prompt: `${left} - ${right} + ${third}`, answer: left - right + third };
}

function buildRapidMathLevel(level: number): RapidMathRelayChallenge {
  const question = buildMathQuestion(level);
  return {
    game: "rapid-math-relay",
    level,
    prompt: question.prompt,
    answer: question.answer,
    timeLimitMs: Math.max(2500, 9000 - level * 320),
  };
}

export function buildProgressiveRunChallenge(gameKey: ProgressiveRunGameKey, level: number): ProgressiveRunServerChallenge {
  switch (gameKey) {
    case "progressive-mosaic":
      return buildProgressiveMosaicLevel(level);
    case "clue-ladder":
      return buildClueLadderLevel(level);
    case "spot-the-missing":
      return buildSpotTheMissingLevel(level);
    case "rapid-math-relay":
      return buildRapidMathLevel(level);
    default:
      throw new Error(`Unhandled progression game key: ${String(gameKey)}`);
  }
}

export function buildPublicProgressiveRunChallenge(challenge: ProgressiveRunServerChallenge, shownCount = 0): ProgressiveRunPublicChallenge {
  switch (challenge.game) {
    case "progressive-mosaic":
      return {
        game: challenge.game,
        level: challenge.level,
        options: challenge.options,
        maxReveals: challenge.maxReveals,
        shownReveals: challenge.reveals.slice(0, shownCount),
        timeLimitMs: challenge.timeLimitMs,
      };
    case "clue-ladder":
      return {
        game: challenge.game,
        level: challenge.level,
        options: challenge.options,
        totalClues: challenge.totalClues,
        shownClues: challenge.clues.slice(0, shownCount),
        timeLimitMs: challenge.timeLimitMs,
      };
    case "spot-the-missing":
      return {
        game: challenge.game,
        level: challenge.level,
        shown: challenge.shown,
        remaining: challenge.remaining,
        options: challenge.options,
        timeLimitMs: challenge.timeLimitMs,
      };
    case "rapid-math-relay":
      return {
        game: challenge.game,
        level: challenge.level,
        prompt: challenge.prompt,
        timeLimitMs: challenge.timeLimitMs,
      };
  }
}

export function createProgressiveRunSession(gameKey: ProgressiveRunGameKey) {
  const currentChallenge = buildProgressiveRunChallenge(gameKey, 1);
  const shownCount = currentChallenge.game === "progressive-mosaic" || currentChallenge.game === "clue-ladder" ? 1 : 0;
  const progressState: ProgressiveRunState = {
    mode: "competitive-run",
    game: gameKey,
    status: "RUNNING",
    currentLevel: 1,
    levelsCleared: 0,
    mistakes: 0,
    totalElapsedMs: 0,
    totalRevealCount: shownCount,
    currentChallenge,
    shownCount,
  };
  return {
    serverChallenge: currentChallenge,
    publicChallenge: buildPublicProgressiveRunChallenge(currentChallenge, shownCount),
    progressState,
  };
}

function normalizeState(gameKey: ProgressiveRunGameKey, fallbackChallenge: ProgressiveRunServerChallenge, state: unknown): ProgressiveRunState {
  if (
    state &&
    typeof state === "object" &&
    (state as ProgressiveRunState).mode === "competitive-run" &&
    (state as ProgressiveRunState).game === gameKey
  ) {
    const typed = state as ProgressiveRunState;
    return {
      ...typed,
      currentChallenge: typed.currentChallenge ?? fallbackChallenge,
      shownCount: clampInt(typed.shownCount, 0, 32),
      currentLevel: clampInt(typed.currentLevel, 1, 99),
      levelsCleared: clampInt(typed.levelsCleared, 0, 99),
      mistakes: clampInt(typed.mistakes, 0, 99),
      totalElapsedMs: clampInt(typed.totalElapsedMs, 0, 600000),
      totalRevealCount: clampInt(typed.totalRevealCount, 0, 999),
    };
  }
  return {
    mode: "competitive-run",
    game: gameKey,
    status: "RUNNING",
    currentLevel: fallbackChallenge.level,
    levelsCleared: 0,
    mistakes: 0,
    totalElapsedMs: 0,
    totalRevealCount: fallbackChallenge.game === "progressive-mosaic" || fallbackChallenge.game === "clue-ladder" ? 1 : 0,
    currentChallenge: fallbackChallenge,
    shownCount: fallbackChallenge.game === "progressive-mosaic" || fallbackChallenge.game === "clue-ladder" ? 1 : 0,
  };
}

function finishedResponse(progressState: ProgressiveRunState, game: ProgressiveRunGameKey) {
  return {
    ok: true,
    game,
    finished: true,
    run: {
      status: progressState.status,
      levelsCleared: progressState.levelsCleared,
      mistakes: progressState.mistakes,
      currentLevel: progressState.currentLevel,
      totalElapsedMs: progressState.totalElapsedMs,
      totalRevealCount: progressState.totalRevealCount,
      finishedReason: progressState.finishedReason,
    },
  };
}

function nextLevelResponse(progressState: ProgressiveRunState) {
  return {
    ok: true,
    game: progressState.game,
    finished: false,
    nextChallenge: buildPublicProgressiveRunChallenge(progressState.currentChallenge, progressState.shownCount),
    run: {
      status: progressState.status,
      levelsCleared: progressState.levelsCleared,
      mistakes: progressState.mistakes,
      currentLevel: progressState.currentLevel,
      totalElapsedMs: progressState.totalElapsedMs,
      totalRevealCount: progressState.totalRevealCount,
    },
  };
}

export function handleProgressiveRunProgress(
  gameKey: ProgressiveRunGameKey,
  initialChallenge: unknown,
  progressState: unknown,
  body: Record<string, any>,
): ProgressiveRunProgressResult {
  const fallbackChallenge = (initialChallenge && typeof initialChallenge === "object" ? initialChallenge : null) as ProgressiveRunServerChallenge | null;
  const baseChallenge = fallbackChallenge && fallbackChallenge.game === gameKey ? fallbackChallenge : buildProgressiveRunChallenge(gameKey, 1);
  const state = normalizeState(gameKey, baseChallenge, progressState);

  if (state.status !== "RUNNING") {
    return { ok: false, status: 409, error: "This competitive run is already complete." };
  }

  const current = state.currentChallenge;
  const action = String(body?.action || "").trim();

  if ((gameKey === "progressive-mosaic" || gameKey === "clue-ladder") && action === "reveal") {
    const max = current.game === "progressive-mosaic" ? current.maxReveals : current.totalClues;
    const nextShown = Math.min(max, state.shownCount + 1);
    const nextState = { ...state, shownCount: nextShown, totalRevealCount: state.totalRevealCount + 1 };
    return {
      ok: true,
      progressState: nextState,
      data:
        current.game === "progressive-mosaic"
          ? {
              ok: true,
              game: current.game,
              shownReveals: current.reveals.slice(0, nextShown),
              revealed: nextShown,
              exhausted: nextShown >= max,
            }
          : {
              ok: true,
              game: current.game,
              shownClues: current.clues.slice(0, nextShown),
              revealed: nextShown,
              exhausted: nextShown >= max,
            },
    };
  }

  if (action !== "resolve_level") {
    return { ok: false, status: 422, error: "Unsupported progression action." };
  }

  const levelElapsedMs = clampInt(body?.elapsedMs, 0, 120000);
  const timedOut = Boolean(body?.timedOut);
  let success = false;

  if (current.game === "progressive-mosaic" || current.game === "clue-ladder") {
    success = !timedOut && String(body?.selectedId || "") === current.answerId;
  } else if (current.game === "spot-the-missing") {
    success = !timedOut && String(body?.selectedId || "") === current.missing;
  } else if (current.game === "rapid-math-relay") {
    success = !timedOut && Number(body?.answer) === current.answer;
  }

  const nextBase = {
    ...state,
    totalElapsedMs: state.totalElapsedMs + levelElapsedMs,
    lastLevelElapsedMs: levelElapsedMs,
  };

  if (!success) {
    const failed: ProgressiveRunState = {
      ...nextBase,
      mistakes: state.mistakes + 1,
      status: timedOut ? "TIMED_OUT" : "FAILED",
      lastOutcome: timedOut ? "TIMED_OUT" : "FAILED",
      finishedReason: timedOut ? "time_limit" : "mistake",
    };
    return { ok: true, progressState: failed, data: finishedResponse(failed, gameKey) };
  }

  const nextLevel = state.currentLevel + 1;
  const nextChallenge = buildProgressiveRunChallenge(gameKey, nextLevel);
  const shownCount = nextChallenge.game === "progressive-mosaic" || nextChallenge.game === "clue-ladder" ? 1 : 0;
  const advanced: ProgressiveRunState = {
    ...nextBase,
    currentLevel: nextLevel,
    levelsCleared: state.levelsCleared + 1,
    currentChallenge: nextChallenge,
    shownCount,
    totalRevealCount: state.totalRevealCount + shownCount,
    lastOutcome: "CLEARED",
  };
  return { ok: true, progressState: advanced, data: nextLevelResponse(advanced) };
}

export function computeProgressiveRunScore(state: Pick<ProgressiveRunState, "game" | "levelsCleared" | "mistakes" | "totalElapsedMs" | "totalRevealCount" | "status">, serverElapsedMs: number) {
  const effectiveElapsed = Math.max(state.totalElapsedMs, serverElapsedMs);
  const levelWeight =
    state.game === "rapid-math-relay" ? 6200 :
    state.game === "spot-the-missing" ? 5600 :
    state.game === "clue-ladder" ? 6000 : 6100;
  const levelPoints = state.levelsCleared * levelWeight;
  const revealPenalty = state.totalRevealCount * 220;
  const mistakePenalty = state.mistakes * 3000;
  const elapsedPenalty = Math.floor(effectiveElapsed / 30);
  const finishBonus = state.status === "FAILED" ? 450 : state.status === "TIMED_OUT" ? 0 : 300;
  return Math.max(0, levelPoints + finishBonus - revealPenalty - mistakePenalty - elapsedPenalty);
}

export function verifyProgressiveRunAttempt(
  gameKey: ProgressiveRunGameKey,
  _initialChallenge: unknown,
  _meta: Record<string, any>,
  serverElapsedMs: number,
  progressState: unknown,
): VerificationResult {
  const challenge = buildProgressiveRunChallenge(gameKey, 1);
  const state = normalizeState(gameKey, challenge, progressState);
  if (state.mode !== "competitive-run" || state.game !== gameKey) {
    return { valid: false, scoreMs: 0, flags: { reason: "invalid_progressive_run_state" } };
  }
  if (state.status === "RUNNING") {
    return { valid: false, scoreMs: 0, flags: { reason: "run_not_complete" } };
  }
  const scoreMs = computeProgressiveRunScore(state, serverElapsedMs);
  return {
    valid: true,
    scoreMs,
    flags: {
      mode: "competitive-run",
      status: state.status,
      levelsCleared: state.levelsCleared,
      mistakes: state.mistakes,
      totalElapsedMs: Math.max(state.totalElapsedMs, serverElapsedMs),
      totalRevealCount: state.totalRevealCount,
      currentLevel: state.currentLevel,
      finishedReason: state.finishedReason,
    },
  };
}
