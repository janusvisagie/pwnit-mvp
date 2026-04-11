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

type Palette = [string, string];

type ProgressiveMosaicTarget = {
  id: string;
  label: string;
  emoji: string;
  palette: Palette;
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
  targetGlyph: string;
  palette: Palette;
  overlayOrder: number[];
  tileCount: number;
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
  | (Omit<ProgressiveMosaicChallenge, "answerId"> & { shownRevealCount: number })
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
  recentAnswerIds: string[];
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
  { id: "fuel-voucher", label: "Fuel Voucher", emoji: "⛽", palette: ["#1d4ed8", "#0f172a"] },
  { id: "grocery-voucher", label: "Grocery Voucher", emoji: "🛒", palette: ["#16a34a", "#14532d"] },
  { id: "online-voucher", label: "Online Voucher", emoji: "📦", palette: ["#7c3aed", "#312e81"] },
  { id: "headphones", label: "Headphones", emoji: "🎧", palette: ["#111827", "#475569"] },
  { id: "switch", label: "Nintendo Switch", emoji: "🎮", palette: ["#ef4444", "#1f2937"] },
  { id: "camera", label: "Action Camera", emoji: "📷", palette: ["#0f172a", "#334155"] },
  { id: "bonus-credits", label: "Bonus Credits", emoji: "⭐", palette: ["#f59e0b", "#92400e"] },
  { id: "podium-place", label: "Podium Place", emoji: "🏆", palette: ["#eab308", "#713f12"] },
  { id: "smart-tv", label: "Smart TV", emoji: "📺", palette: ["#0ea5e9", "#1e293b"] },
  { id: "smartwatch", label: "Smartwatch", emoji: "⌚", palette: ["#64748b", "#0f172a"] },
  { id: "speaker", label: "Bluetooth Speaker", emoji: "🔊", palette: ["#9333ea", "#111827"] },
  { id: "laptop", label: "Laptop", emoji: "💻", palette: ["#22c55e", "#0f172a"] },
  { id: "drone", label: "Drone", emoji: "🚁", palette: ["#06b6d4", "#164e63"] },
  { id: "ar-glasses", label: "AR Glasses", emoji: "🥽", palette: ["#f97316", "#7c2d12"] },
];

const CLUE_TARGETS: ClueLadderTarget[] = [
  {
    id: "next-18",
    label: "18",
    emoji: "🔢",
    clues: [
      "6, 9, 12, 15, ?",
      "Add 3 each step.",
      "The chain keeps rising by the same amount.",
      "The missing value is just after 15.",
      "One more +3 finishes it.",
      "The next number is 18.",
    ],
  },
  {
    id: "next-28",
    label: "28",
    emoji: "🔢",
    clues: [
      "7, 14, 21, ?",
      "Add 7 each step.",
      "These are growing multiples of 7.",
      "The missing value is the fourth multiple of 7.",
      "It comes right after 21.",
      "The next number is 28.",
    ],
  },
  {
    id: "next-32",
    label: "32",
    emoji: "🔢",
    clues: [
      "2, 4, 8, 16, ?",
      "Double each term.",
      "Powers of two are building up.",
      "The jump keeps growing by multiplication, not addition.",
      "One more doubling step finishes it.",
      "The next number is 32.",
    ],
  },
  {
    id: "next-42",
    label: "42",
    emoji: "🔢",
    clues: [
      "12, 18, 24, 30, 36, ?",
      "Add 6 each step.",
      "It is a steady arithmetic chain.",
      "The missing value comes one step after 36.",
      "Keep the +6 pattern going once more.",
      "The next number is 42.",
    ],
  },
  {
    id: "next-54",
    label: "54",
    emoji: "🔢",
    clues: [
      "9, 18, 27, 36, 45, ?",
      "Add 9 each step.",
      "These are multiples of 9.",
      "The answer is one more multiple after 45.",
      "Keep the same +9 rhythm.",
      "The next number is 54.",
    ],
  },
  {
    id: "next-64",
    label: "64",
    emoji: "🔢",
    clues: [
      "1, 4, 16, ?",
      "Multiply by 4 each step.",
      "Each jump is larger because it scales.",
      "This is a powers-of-4 chain.",
      "One more ×4 finishes it.",
      "The next number is 64.",
    ],
  },
  {
    id: "next-81",
    label: "81",
    emoji: "🔢",
    clues: [
      "3, 9, 27, ?",
      "Multiply by 3 each step.",
      "The chain keeps tripling.",
      "It grows faster than a simple + pattern.",
      "One more ×3 gives the answer.",
      "The next number is 81.",
    ],
  },
  {
    id: "next-96",
    label: "96",
    emoji: "🔢",
    clues: [
      "24, 36, 48, 60, 72, 84, ?",
      "Add 12 each step.",
      "It is a steady arithmetic ladder.",
      "The answer sits one move after 84.",
      "Keep the +12 pattern one more time.",
      "The next number is 96.",
    ],
  },
  {
    id: "next-99",
    label: "99",
    emoji: "🔢",
    clues: [
      "11, 22, 33, 44, 55, 66, 77, 88, ?",
      "Add 11 each step.",
      "These are multiples of 11.",
      "The chain is still climbing in equal jumps.",
      "One more +11 finishes it.",
      "The next number is 99.",
    ],
  },
  {
    id: "next-120",
    label: "120",
    emoji: "🔢",
    clues: [
      "20, 40, 60, 80, 100, ?",
      "Add 20 each step.",
      "Every term is a multiple of 20.",
      "The answer comes right after 100.",
      "Keep the same +20 pace.",
      "The next number is 120.",
    ],
  },
  {
    id: "next-144",
    label: "144",
    emoji: "🔢",
    clues: [
      "24, 48, 72, 96, 120, ?",
      "Add 24 each step.",
      "The chain moves in even, equal jumps.",
      "The answer is one step after 120.",
      "Keep the +24 pattern going.",
      "The next number is 144.",
    ],
  },
  {
    id: "next-200",
    label: "200",
    emoji: "🔢",
    clues: [
      "50, 80, 110, 140, 170, ?",
      "Add 30 each step.",
      "It is a fixed-step arithmetic chain.",
      "The answer lands just after 170.",
      "One more +30 closes the gap.",
      "The next number is 200.",
    ],
  },
];

const WORD_BANK = ["Pick", "Play", "PwnIt", "Prize", "Bonus", "Boost", "Credit", "Target", "Podium", "Voucher", "Unlock", "Winner"] as const;
const MOSAIC_TILE_COUNT = 16;

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

export function isProgressiveRunGameKey(gameKey: string): gameKey is ProgressiveRunGameKey {
  return (PROGRESSIVE_RUN_GAME_KEYS as readonly string[]).includes(gameKey);
}

function recentWindow(values: readonly string[], size = 4) {
  return values.slice(Math.max(0, values.length - size));
}

function pickFreshTarget<T extends { id: string }>(source: readonly T[], recentIds: readonly string[]) {
  const recentSet = new Set(recentWindow(recentIds));
  const freshPool = source.filter((entry) => !recentSet.has(entry.id));
  return choice(freshPool.length ? freshPool : source);
}

function buildChoiceOptions<T extends { id: string; label: string; emoji: string }>(
  source: readonly T[],
  correctId: string,
  count: number,
  recentIds: readonly string[] = [],
) {
  const cappedCount = Math.max(2, Math.min(count, source.length));
  const correct = source.find((entry) => entry.id === correctId) ?? choice(source);
  const recentSet = new Set(recentWindow(recentIds).filter((id) => id !== correct.id));
  const distractors = source.filter((entry) => entry.id !== correct.id);
  const fresh = shuffle(distractors.filter((entry) => !recentSet.has(entry.id)));
  const repeated = shuffle(distractors.filter((entry) => recentSet.has(entry.id)));
  const chosen = [...fresh, ...repeated].slice(0, Math.max(0, cappedCount - 1));
  return shuffle([correct, ...chosen]).map(({ id, label, emoji }) => ({ id, label, emoji }));
}

function buildOverlayOrder(tileCount: number) {
  return shuffle(Array.from({ length: tileCount }, (_, index) => index));
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

function buildProgressiveMosaicLevel(level: number, recentAnswerIds: readonly string[] = []): ProgressiveMosaicChallenge {
  const target = pickFreshTarget(MOSAIC_TARGETS, recentAnswerIds);
  const maxReveals = mosaicRevealCount(level);
  return {
    game: "progressive-mosaic",
    level,
    answerId: target.id,
    options: buildChoiceOptions(MOSAIC_TARGETS, target.id, optionCount(level), recentAnswerIds),
    targetGlyph: target.emoji,
    palette: target.palette,
    overlayOrder: buildOverlayOrder(MOSAIC_TILE_COUNT),
    tileCount: MOSAIC_TILE_COUNT,
    maxReveals,
    timeLimitMs: Math.max(6000, 15500 - level * 650),
  };
}

function buildClueLadderLevel(level: number, recentAnswerIds: readonly string[] = []): ClueLadderChallenge {
  const target = pickFreshTarget(CLUE_TARGETS, recentAnswerIds);
  const totalClues = clueCount(level);
  return {
    game: "clue-ladder",
    level,
    answerId: target.id,
    options: buildChoiceOptions(CLUE_TARGETS, target.id, optionCount(level), recentAnswerIds),
    clues: target.clues.slice(0, totalClues),
    totalClues,
    timeLimitMs: Math.max(6500, 16000 - level * 620),
  };
}

function buildSpotTheMissingLevel(level: number): SpotTheMissingChallenge {
  const showCount = Math.min(8, 5 + level);
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

function initialShownCount(challenge: ProgressiveRunServerChallenge) {
  return challenge.game === "progressive-mosaic" || challenge.game === "clue-ladder" ? 1 : 0;
}

function initialHistoryForChallenge(challenge: ProgressiveRunServerChallenge) {
  if (challenge.game === "progressive-mosaic" || challenge.game === "clue-ladder") {
    return [challenge.answerId];
  }
  return [];
}

export function buildProgressiveRunChallenge(
  gameKey: ProgressiveRunGameKey,
  level: number,
  recentAnswerIds: readonly string[] = [],
): ProgressiveRunServerChallenge {
  switch (gameKey) {
    case "progressive-mosaic":
      return buildProgressiveMosaicLevel(level, recentAnswerIds);
    case "clue-ladder":
      return buildClueLadderLevel(level, recentAnswerIds);
    case "spot-the-missing":
      return buildSpotTheMissingLevel(level);
    case "rapid-math-relay":
      return buildRapidMathLevel(level);
    default:
      throw new Error(`Unhandled progression game key: ${String(gameKey)}`);
  }
}

export function buildPublicProgressiveRunChallenge(
  challenge: ProgressiveRunServerChallenge,
  shownCount = 0,
): ProgressiveRunPublicChallenge {
  switch (challenge.game) {
    case "progressive-mosaic":
      return {
        game: challenge.game,
        level: challenge.level,
        options: challenge.options,
        targetGlyph: challenge.targetGlyph,
        palette: challenge.palette,
        overlayOrder: challenge.overlayOrder,
        tileCount: challenge.tileCount,
        maxReveals: challenge.maxReveals,
        shownRevealCount: shownCount,
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
  const shownCount = initialShownCount(currentChallenge);
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
    recentAnswerIds: initialHistoryForChallenge(currentChallenge),
  };
  return {
    serverChallenge: currentChallenge,
    publicChallenge: buildPublicProgressiveRunChallenge(currentChallenge, shownCount),
    progressState,
  };
}

function normalizeState(
  gameKey: ProgressiveRunGameKey,
  fallbackChallenge: ProgressiveRunServerChallenge,
  state: unknown,
): ProgressiveRunState {
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
      recentAnswerIds: Array.isArray((typed as any).recentAnswerIds)
        ? (typed as any).recentAnswerIds.filter((value: unknown) => typeof value === "string").slice(-8)
        : initialHistoryForChallenge(typed.currentChallenge ?? fallbackChallenge),
    };
  }

  const shownCount = initialShownCount(fallbackChallenge);
  return {
    mode: "competitive-run",
    game: gameKey,
    status: "RUNNING",
    currentLevel: fallbackChallenge.level,
    levelsCleared: 0,
    mistakes: 0,
    totalElapsedMs: 0,
    totalRevealCount: shownCount,
    currentChallenge: fallbackChallenge,
    shownCount,
    recentAnswerIds: initialHistoryForChallenge(fallbackChallenge),
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
  const fallbackChallenge = (initialChallenge && typeof initialChallenge === "object"
    ? initialChallenge
    : null) as ProgressiveRunServerChallenge | null;
  const baseChallenge =
    fallbackChallenge && fallbackChallenge.game === gameKey
      ? fallbackChallenge
      : buildProgressiveRunChallenge(gameKey, 1);
  const state = normalizeState(gameKey, baseChallenge, progressState);

  if (state.status !== "RUNNING") {
    return { ok: false, status: 409, error: "This competitive run is already complete." };
  }

  const current = state.currentChallenge;
  const action = String(body?.action || "").trim();

  if (current.game === "progressive-mosaic" && action === "reveal") {
    const nextShown = Math.min(current.maxReveals, state.shownCount + 1);
    const nextState: ProgressiveRunState = {
      ...state,
      shownCount: nextShown,
      totalRevealCount: state.totalRevealCount + 1,
    };
    return {
      ok: true,
      progressState: nextState,
      data: {
        ok: true,
        game: current.game,
        shownRevealCount: nextShown,
        exhausted: nextShown >= current.maxReveals,
      },
    };
  }

  if (current.game === "clue-ladder" && action === "reveal") {
    const nextShown = Math.min(current.totalClues, state.shownCount + 1);
    const nextState: ProgressiveRunState = {
      ...state,
      shownCount: nextShown,
      totalRevealCount: state.totalRevealCount + 1,
    };
    return {
      ok: true,
      progressState: nextState,
      data: {
        ok: true,
        game: current.game,
        shownClues: current.clues.slice(0, nextShown),
        revealed: nextShown,
        exhausted: nextShown >= current.totalClues,
      },
    };
  }

  if (action != "resolve_level") {
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
  const nextChallenge = buildProgressiveRunChallenge(gameKey, nextLevel, state.recentAnswerIds);
  const shownCount = initialShownCount(nextChallenge);
  const advanced: ProgressiveRunState = {
    ...nextBase,
    currentLevel: nextLevel,
    levelsCleared: state.levelsCleared + 1,
    currentChallenge: nextChallenge,
    shownCount,
    totalRevealCount: state.totalRevealCount + shownCount,
    recentAnswerIds: [...state.recentAnswerIds, ...initialHistoryForChallenge(nextChallenge)].slice(-8),
    lastOutcome: "CLEARED",
  };
  return { ok: true, progressState: advanced, data: nextLevelResponse(advanced) };
}

export function computeProgressiveRunScore(
  state: Pick<
    ProgressiveRunState,
    "game" | "levelsCleared" | "mistakes" | "totalElapsedMs" | "totalRevealCount" | "status"
  >,
  serverElapsedMs: number,
) {
  const effectiveElapsed = Math.max(state.totalElapsedMs, serverElapsedMs);
  const levelWeight =
    state.game === "rapid-math-relay"
      ? 6200
      : state.game === "spot-the-missing"
        ? 5600
        : state.game === "clue-ladder"
          ? 6000
          : 6100;
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
      recentAnswerIds: state.recentAnswerIds,
    },
  };
}
