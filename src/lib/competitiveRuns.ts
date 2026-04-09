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
    id: "fuel-voucher",
    label: "Fuel Voucher",
    emoji: "⛽",
    clues: [
      "Useful when the tank is low.",
      "Practical travel spend beats flashy gadgets here.",
      "It matters most before or during a road trip.",
      "Redeemed at a filling station.",
      "It helps movement, not entertainment.",
      "This voucher keeps the car going.",
    ],
  },
  {
    id: "grocery-voucher",
    label: "Grocery Voucher",
    emoji: "🛒",
    clues: [
      "Think essentials rather than electronics.",
      "This fits a trolley better than a gadget bag.",
      "Useful almost every week.",
      "Redeemed where baskets and tills matter.",
      "It supports household basics.",
      "This voucher belongs with groceries.",
    ],
  },
  {
    id: "online-voucher",
    label: "Online Voucher",
    emoji: "📦",
    clues: [
      "Convenience matters more than a queue.",
      "Shopping happens from a screen, not an aisle.",
      "Delivery is part of the story.",
      "Redeemed through an online checkout.",
      "It points to e-commerce, not a store trolley.",
      "This voucher is for online orders.",
    ],
  },
  {
    id: "headphones",
    label: "Headphones",
    emoji: "🎧",
    clues: [
      "Made for one person's ears at a time.",
      "It improves a private media experience.",
      "Useful for focus, music, or travel.",
      "You wear it rather than place it on a desk.",
      "It keeps sound close and personal.",
      "This is over-ear listening gear.",
    ],
  },
  {
    id: "switch",
    label: "Nintendo Switch",
    emoji: "🎮",
    clues: [
      "Built for play rather than productivity.",
      "Portable use is part of the appeal.",
      "It can move between handheld and docked modes.",
      "Detachable controls make it distinctive.",
      "This is a hybrid console.",
      "Nintendo made it.",
    ],
  },
  {
    id: "camera",
    label: "Action Camera",
    emoji: "📷",
    clues: [
      "It captures moments instead of playing them back.",
      "Motion and adventure suit it well.",
      "Compact size matters here.",
      "Often mounted to gear or a helmet.",
      "It is rugged and travel-friendly.",
      "This is an action camera.",
    ],
  },
  {
    id: "bonus-credits",
    label: "Bonus Credits",
    emoji: "⭐",
    clues: [
      "This is platform value, not a parcel.",
      "It keeps you competing longer.",
      "Redeemed inside the experience itself.",
      "It buys you more tries rather than shipping.",
      "You cannot hold it in your hand like a gadget.",
      "These are extra credits.",
    ],
  },
  {
    id: "podium-place",
    label: "Podium Place",
    emoji: "🏆",
    clues: [
      "A result matters more than a product.",
      "This lives on the leaderboard.",
      "Players chase it every round.",
      "Bragging rights matter.",
      "Winners stand near here.",
      "It is a podium finish.",
    ],
  },
  {
    id: "smart-tv",
    label: "Smart TV",
    emoji: "📺",
    clues: [
      "This is for the lounge rather than the pocket.",
      "Streaming matters more than portability.",
      "It dominates a wall or cabinet, not a desk drawer.",
      "Remote control use is expected.",
      "Movies, series, and sport look better on it.",
      "This is a smart television.",
    ],
  },
  {
    id: "smartwatch",
    label: "Smartwatch",
    emoji: "⌚",
    clues: [
      "It lives on the wrist.",
      "Notifications travel with you.",
      "It mixes fitness with convenience.",
      "Smaller than a phone, smarter than a classic watch.",
      "Health tracking often matters.",
      "This is a smartwatch.",
    ],
  },
  {
    id: "speaker",
    label: "Bluetooth Speaker",
    emoji: "🔊",
    clues: [
      "This shares sound with a room.",
      "Portability helps, but ears do not wear it.",
      "Music becomes social instead of private.",
      "Wireless pairing is part of the appeal.",
      "It is about louder playback, not silent focus.",
      "This is a Bluetooth speaker.",
    ],
  },
  {
    id: "laptop",
    label: "Laptop",
    emoji: "💻",
    clues: [
      "It opens and closes like a working shell.",
      "Useful for school, work, and browsing.",
      "It travels better than a desktop.",
      "Keyboard and screen stay attached.",
      "It does more than a tablet in most workflows.",
      "This is a laptop.",
    ],
  },
  {
    id: "drone",
    label: "Drone",
    emoji: "🚁",
    clues: [
      "This moves through the air rather than on a desk.",
      "Remote control is essential.",
      "Photography may happen from above.",
      "Outdoor use makes more sense than indoor shelves.",
      "Flying is the whole point.",
      "This is a drone.",
    ],
  },
  {
    id: "ar-glasses",
    label: "AR Glasses",
    emoji: "🥽",
    clues: [
      "This sits in front of your eyes.",
      "It mixes tech with wearable form.",
      "Hands-free visuals are part of the idea.",
      "Less ordinary than standard eyewear.",
      "Digital overlays matter more than audio alone.",
      "These are AR glasses.",
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

  if (gameKey === "progressive-mosaic" && action === "reveal") {
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

  if (gameKey === "clue-ladder" && action === "reveal") {
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
