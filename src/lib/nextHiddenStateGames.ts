export const NEXT_HIDDEN_STATE_GAME_KEYS = [
  "progressive-mosaic",
  "clue-ladder",
  "safe-path-fog",
  "signal-hunt",
] as const;

export type NextHiddenStateGameKey = (typeof NEXT_HIDDEN_STATE_GAME_KEYS)[number];

export type ChoiceOption = {
  id: string;
  label: string;
  emoji: string;
};

export type ProgressiveMosaicChallenge = {
  game: "progressive-mosaic";
  answerId: string;
  options: ChoiceOption[];
  reveals: string[];
  maxReveals: number;
};

export type ProgressiveMosaicPublicChallenge = {
  game: "progressive-mosaic";
  options: ChoiceOption[];
  maxReveals: number;
};

export type ClueLadderChallenge = {
  game: "clue-ladder";
  answerId: string;
  options: ChoiceOption[];
  clues: string[];
};

export type ClueLadderPublicChallenge = {
  game: "clue-ladder";
  options: ChoiceOption[];
  totalClues: number;
};

export type SafePathFogChallenge = {
  game: "safe-path-fog";
  size: number;
  start: number;
  goal: number;
  hazards: number[];
  maxMoves: number;
};

export type SafePathFogPublicChallenge = {
  game: "safe-path-fog";
  size: number;
  start: number;
  goal: number;
  maxMoves: number;
  startHint: number;
};

export type SignalHuntChallenge = {
  game: "signal-hunt";
  targetPair: [string, string];
  stream: string[];
  symbolPool: string[];
  maxSteps: number;
};

export type SignalHuntPublicChallenge = {
  game: "signal-hunt";
  targetPair: [string, string];
  symbolPool: string[];
  maxSteps: number;
};

export type AdditionalVerifiedChallenge =
  | ProgressiveMosaicChallenge
  | ClueLadderChallenge
  | SafePathFogChallenge
  | SignalHuntChallenge;

export type AdditionalPublicVerifiedChallenge =
  | ProgressiveMosaicPublicChallenge
  | ClueLadderPublicChallenge
  | SafePathFogPublicChallenge
  | SignalHuntPublicChallenge;

type VerificationResult = {
  valid: boolean;
  scoreMs: number;
  flags: Record<string, any>;
};

type ProgressOk = {
  ok: true;
  data: Record<string, any>;
  progressState: Record<string, any>;
};

type ProgressErr = {
  ok: false;
  status: number;
  error: string;
};

export type HiddenStateProgressResult = ProgressOk | ProgressErr;

const PROGRESSIVE_MOSAIC_MAX_SCORE = 26000;
const CLUE_LADDER_MAX_SCORE = 25000;
const SAFE_PATH_FOG_MAX_SCORE = 27000;
const SIGNAL_HUNT_MAX_SCORE = 24000;
const SAFE_PATH_FOG_SIZE = 5;
const SAFE_PATH_FOG_START = 20;
const SAFE_PATH_FOG_GOAL = 4;
const SAFE_PATH_FOG_MAX_MOVES = 10;
const SAFE_PATH_FOG_HAZARDS = 7;
const SIGNAL_HUNT_MAX_STEPS = 12;

const MOSAIC_TARGETS: Array<{ id: string; label: string; emoji: string; reveals: string[] }> = [
  {
    id: "fuel-voucher",
    label: "Fuel Voucher",
    emoji: "⛽",
    reveals: ["Road expense", "Pump handle", "Trip essential", "Used when refuelling"],
  },
  {
    id: "checkers-voucher",
    label: "Checkers Voucher",
    emoji: "🛒",
    reveals: ["Household essentials", "Trolley aisle", "Weekly shop", "Groceries and basics"],
  },
  {
    id: "takealot-voucher",
    label: "Takealot Voucher",
    emoji: "📦",
    reveals: ["Checkout at home", "Delivery box", "Online order", "Redeemed on a shopping site"],
  },
  {
    id: "headphones",
    label: "Headphones",
    emoji: "🎧",
    reveals: ["Private listening", "Over the ears", "Sound focus", "Music without speakers"],
  },
  {
    id: "switch",
    label: "Nintendo Switch",
    emoji: "🎮",
    reveals: ["Portable play", "Detachable controls", "Dock or handheld", "Nintendo hybrid console"],
  },
  {
    id: "camera",
    label: "GoPro Camera",
    emoji: "📷",
    reveals: ["Adventure footage", "Mounted outdoors", "Compact action camera", "Built for motion clips"],
  },
  {
    id: "bonus-credits",
    label: "Bonus Credits",
    emoji: "⭐",
    reveals: ["More chances", "Keeps you playing", "Not a shipped prize", "Extra credits for another run"],
  },
  {
    id: "podium",
    label: "Podium Place",
    emoji: "🏆",
    reveals: ["Top finish", "Bragging rights", "Rank reward", "Where winners stand"],
  },
];

const CLUE_LADDER_TARGETS: Array<{ id: string; label: string; emoji: string; clues: string[] }> = [
  {
    id: "next-18",
    label: "18",
    emoji: "🔢",
    clues: [
      "6, 9, 12, 15, ?",
      "Add 3 each step.",
      "The missing value is just after 15.",
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
      "The answer comes one step after 36.",
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
      "This is a powers-of-4 chain.",
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
      "The answer is one move after 84.",
      "The next number is 96.",
    ],
  },
];

function shuffle<T>(values: readonly T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function randomChoice<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)]!;
}

function clampInt(value: unknown, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function sameArray<T>(left: T[], right: T[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sanitizedElapsed(serverElapsedMs: number, minMs: number) {
  return {
    elapsedMs: Math.max(minMs, Math.round(serverElapsedMs)),
    reason: serverElapsedMs < minMs ? "server_elapsed_clamped_to_plausible_minimum" : null,
  };
}

function buildOptions<T extends { id: string; label: string; emoji: string }>(source: readonly T[], correctId?: string) {
  const correct = correctId ? source.find((entry) => entry.id === correctId) ?? randomChoice(source) : randomChoice(source);
  const distractors = shuffle(source.filter((entry) => entry.id !== correct.id)).slice(0, 3);
  return shuffle([correct, ...distractors]).map(({ id, label, emoji }) => ({ id, label, emoji }));
}

function buildProgressiveMosaicChallenge(): ProgressiveMosaicChallenge {
  const correct = randomChoice(MOSAIC_TARGETS);
  return {
    game: "progressive-mosaic",
    answerId: correct.id,
    options: buildOptions(MOSAIC_TARGETS, correct.id),
    reveals: correct.reveals,
    maxReveals: correct.reveals.length,
  };
}

function buildClueLadderChallenge(): ClueLadderChallenge {
  const correct = randomChoice(CLUE_LADDER_TARGETS);
  return {
    game: "clue-ladder",
    answerId: correct.id,
    options: buildOptions(CLUE_LADDER_TARGETS, correct.id),
    clues: correct.clues,
  };
}

function neighbors(index: number, size: number) {
  const row = Math.floor(index / size);
  const col = index % size;
  const output: number[] = [];
  if (row > 0) output.push(index - size);
  if (row < size - 1) output.push(index + size);
  if (col > 0) output.push(index - 1);
  if (col < size - 1) output.push(index + 1);
  return output;
}

function countAdjacentHazards(index: number, size: number, hazards: Set<number>) {
  return neighbors(index, size).filter((neighbor) => hazards.has(neighbor)).length;
}

function shortestSafePathLength(challenge: SafePathFogChallenge) {
  const hazardSet = new Set<number>(challenge.hazards);
  const queue: Array<{ index: number; dist: number }> = [{ index: challenge.start, dist: 0 }];
  const seen = new Set<number>([challenge.start]);
  while (queue.length) {
    const current = queue.shift()!;
    if (current.index === challenge.goal) return current.dist;
    for (const next of neighbors(current.index, challenge.size)) {
      if (hazardSet.has(next) || seen.has(next)) continue;
      seen.add(next);
      queue.push({ index: next, dist: current.dist + 1 });
    }
  }
  return null;
}

function buildSafePathFogChallenge(): SafePathFogChallenge {
  const allCells = Array.from({ length: SAFE_PATH_FOG_SIZE * SAFE_PATH_FOG_SIZE }, (_, index) => index).filter(
    (index) => index !== SAFE_PATH_FOG_START && index !== SAFE_PATH_FOG_GOAL,
  );

  for (let tries = 0; tries < 400; tries += 1) {
    const hazards = shuffle(allCells).slice(0, SAFE_PATH_FOG_HAZARDS).sort((a, b) => a - b);
    const challenge: SafePathFogChallenge = {
      game: "safe-path-fog",
      size: SAFE_PATH_FOG_SIZE,
      start: SAFE_PATH_FOG_START,
      goal: SAFE_PATH_FOG_GOAL,
      hazards,
      maxMoves: SAFE_PATH_FOG_MAX_MOVES,
    };
    const shortest = shortestSafePathLength(challenge);
    if (shortest != null && shortest >= 6 && shortest <= SAFE_PATH_FOG_MAX_MOVES - 1) {
      return challenge;
    }
  }

  return {
    game: "safe-path-fog",
    size: SAFE_PATH_FOG_SIZE,
    start: SAFE_PATH_FOG_START,
    goal: SAFE_PATH_FOG_GOAL,
    hazards: [1, 2, 6, 8, 11, 17, 18],
    maxMoves: SAFE_PATH_FOG_MAX_MOVES,
  };
}

function buildSignalHuntChallenge(): SignalHuntChallenge {
  const symbolPool = ["▲", "●", "■", "◆", "✦"];
  const shuffled = shuffle(symbolPool);
  const targetPair: [string, string] = [shuffled[0]!, shuffled[1]!];
  const triggerIndex = 4 + Math.floor(Math.random() * 4); // 4..7, 1-based position of 2nd symbol
  const stream: string[] = [];

  while (stream.length < triggerIndex - 2) {
    const next = randomChoice(symbolPool);
    const previous = stream[stream.length - 1] ?? null;
    if (previous === targetPair[0] && next === targetPair[1]) continue;
    stream.push(next);
  }

  stream.push(targetPair[0], targetPair[1]);

  while (stream.length < SIGNAL_HUNT_MAX_STEPS) {
    stream.push(randomChoice(symbolPool));
  }

  return {
    game: "signal-hunt",
    targetPair,
    stream,
    symbolPool,
    maxSteps: SIGNAL_HUNT_MAX_STEPS,
  };
}

export function buildNextHiddenStateChallenge(gameKey: NextHiddenStateGameKey): AdditionalVerifiedChallenge {
  switch (gameKey) {
    case "progressive-mosaic":
      return buildProgressiveMosaicChallenge();
    case "clue-ladder":
      return buildClueLadderChallenge();
    case "safe-path-fog":
      return buildSafePathFogChallenge();
    case "signal-hunt":
      return buildSignalHuntChallenge();
    default:
      throw new Error(`Unhandled next hidden-state game key: ${String(gameKey)}`);
  }
}

export function buildPublicNextHiddenStateChallenge(
  challenge: AdditionalVerifiedChallenge,
): AdditionalPublicVerifiedChallenge {
  switch (challenge.game) {
    case "progressive-mosaic":
      return { game: challenge.game, options: challenge.options, maxReveals: challenge.maxReveals };
    case "clue-ladder":
      return { game: challenge.game, options: challenge.options, totalClues: challenge.clues.length };
    case "safe-path-fog": {
      const hazardSet = new Set<number>(challenge.hazards);
      return {
        game: challenge.game,
        size: challenge.size,
        start: challenge.start,
        goal: challenge.goal,
        maxMoves: challenge.maxMoves,
        startHint: countAdjacentHazards(challenge.start, challenge.size, hazardSet),
      };
    }
    case "signal-hunt":
      return {
        game: challenge.game,
        targetPair: challenge.targetPair,
        symbolPool: challenge.symbolPool,
        maxSteps: challenge.maxSteps,
      };
    default:
      throw new Error(`Unhandled next public hidden-state game key: ${String((challenge as { game?: unknown }).game)}`);
  }
}

function normalizeIntegerDict(source: unknown) {
  if (!source || typeof source !== "object") return {} as Record<string, number>;
  const output: Record<string, number> = {};
  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    output[String(key)] = clampInt(value, 0, 8);
  }
  return output;
}

function normalizeSafePathProgress(progressState: unknown, challenge: SafePathFogChallenge) {
  const source = progressState && typeof progressState === "object" ? (progressState as Record<string, any>) : {};
  const rawPath = Array.isArray(source.path)
    ? source.path.map((value: unknown) => clampInt(value, -1, challenge.size * challenge.size)).filter((value: number) => value >= 0)
    : [challenge.start];
  const path = rawPath.length ? rawPath : [challenge.start];
  return {
    path,
    moveCount: clampInt(source.moveCount, 0, challenge.maxMoves),
    status: String(source.status || "RUNNING"),
    hints: normalizeIntegerDict(source.hints),
  };
}

function evaluateSafePathProgress(challenge: SafePathFogChallenge, progressState: unknown) {
  const hazardSet = new Set<number>(challenge.hazards);
  const progress = normalizeSafePathProgress(progressState, challenge);
  const expectedHints: Record<string, number> = {
    [String(challenge.start)]: countAdjacentHazards(challenge.start, challenge.size, hazardSet),
  };

  if (!progress.path.length || progress.path[0] !== challenge.start) {
    return { valid: false, error: "path_must_start_at_start_cell" } as const;
  }

  let status: "RUNNING" | "WON" | "LOST" = "RUNNING";
  for (let i = 1; i < progress.path.length; i += 1) {
    const previous = progress.path[i - 1]!;
    const next = progress.path[i]!;
    if (!neighbors(previous, challenge.size).includes(next)) {
      return { valid: false, error: "non_adjacent_step" } as const;
    }
    if (hazardSet.has(next)) {
      status = "LOST";
      break;
    }
    expectedHints[String(next)] = countAdjacentHazards(next, challenge.size, hazardSet);
    if (next === challenge.goal) {
      status = "WON";
      break;
    }
    if (i >= challenge.maxMoves) {
      status = "LOST";
      break;
    }
  }

  if (status === "RUNNING" && progress.path.length - 1 >= challenge.maxMoves) {
    status = "LOST";
  }

  for (const [key, value] of Object.entries(expectedHints)) {
    if (progress.hints[key] !== value) {
      return { valid: false, error: "hint_state_tampered" } as const;
    }
  }

  return {
    valid: true,
    status,
    path: progress.path,
    moveCount: progress.path.length - 1,
    hints: expectedHints,
  } as const;
}

function expectedSignalCaptureAt(challenge: SignalHuntChallenge) {
  for (let i = 2; i <= challenge.stream.length; i += 1) {
    if (
      challenge.stream[i - 2] === challenge.targetPair[0] &&
      challenge.stream[i - 1] === challenge.targetPair[1]
    ) {
      return i;
    }
  }
  return null;
}

function normalizeSignalProgress(progressState: unknown, challenge: SignalHuntChallenge) {
  const source = progressState && typeof progressState === "object" ? (progressState as Record<string, any>) : {};
  const index = clampInt(source.index, 0, challenge.maxSteps);
  const revealed = Array.isArray(source.revealed) ? source.revealed.map((value: unknown) => String(value || "")) : [];
  return {
    index,
    revealed,
    capturedAt: source.capturedAt == null ? null : clampInt(source.capturedAt, 0, challenge.maxSteps),
  };
}

export function handleNextHiddenStateProgress(
  gameKey: string,
  challenge: unknown,
  progressState: unknown,
  body: Record<string, any>,
): HiddenStateProgressResult {
  if (gameKey === "progressive-mosaic") {
    const typed = challenge as ProgressiveMosaicChallenge;
    if (!Array.isArray(typed?.reveals) || !Array.isArray(typed?.options)) {
      return { ok: false, status: 422, error: "Invalid progressive mosaic challenge." };
    }
    const source = progressState && typeof progressState === "object" ? (progressState as Record<string, any>) : {};
    const revealed = clampInt(source.revealed, 0, typed.maxReveals);
    if (String(body?.action || "reveal") !== "reveal") {
      return { ok: false, status: 422, error: "Unsupported mosaic action." };
    }
    const nextRevealed = Math.min(typed.maxReveals, revealed + 1);
    return {
      ok: true,
      progressState: { revealed: nextRevealed },
      data: {
        ok: true,
        game: "progressive-mosaic",
        revealed: nextRevealed,
        reveals: typed.reveals.slice(0, nextRevealed),
        exhausted: nextRevealed >= typed.maxReveals,
      },
    };
  }

  if (gameKey === "clue-ladder") {
    const typed = challenge as ClueLadderChallenge;
    if (!Array.isArray(typed?.clues) || !Array.isArray(typed?.options)) {
      return { ok: false, status: 422, error: "Invalid clue ladder challenge." };
    }
    const source = progressState && typeof progressState === "object" ? (progressState as Record<string, any>) : {};
    const revealed = clampInt(source.revealed, 0, typed.clues.length);
    if (String(body?.action || "reveal") !== "reveal") {
      return { ok: false, status: 422, error: "Unsupported clue action." };
    }
    const nextRevealed = Math.min(typed.clues.length, revealed + 1);
    return {
      ok: true,
      progressState: { revealed: nextRevealed },
      data: {
        ok: true,
        game: "clue-ladder",
        revealed: nextRevealed,
        clues: typed.clues.slice(0, nextRevealed),
        exhausted: nextRevealed >= typed.clues.length,
      },
    };
  }

  if (gameKey === "safe-path-fog") {
    const typed = challenge as SafePathFogChallenge;
    if (!Array.isArray(typed?.hazards) || typeof typed?.size !== "number") {
      return { ok: false, status: 422, error: "Invalid safe path challenge." };
    }
    const source = progressState && typeof progressState === "object" ? (progressState as Record<string, any>) : {};
    const currentPath = Array.isArray(source.path)
      ? source.path.map((value: unknown) => clampInt(value, -1, typed.size * typed.size)).filter((value: number) => value >= 0)
      : [typed.start];
    const path = currentPath.length ? currentPath : [typed.start];
    const current = path[path.length - 1] ?? typed.start;
    const next = clampInt(body?.nextIndex, -1, typed.size * typed.size);
    if (String(source.status || "RUNNING") !== "RUNNING") {
      return { ok: false, status: 409, error: "This safe-path run is already complete." };
    }
    if (next < 0 || !neighbors(current, typed.size).includes(next)) {
      return { ok: false, status: 422, error: "Pick an adjacent fog tile." };
    }

    const hazardSet = new Set<number>(typed.hazards);
    const nextPath = [...path, next];
    const nextHints = normalizeIntegerDict(source.hints);
    if (nextHints[String(typed.start)] == null) {
      nextHints[String(typed.start)] = countAdjacentHazards(typed.start, typed.size, hazardSet);
    }

    let status: "RUNNING" | "WON" | "LOST" = "RUNNING";
    let exploded = false;

    if (hazardSet.has(next)) {
      status = "LOST";
      exploded = true;
    } else {
      nextHints[String(next)] = countAdjacentHazards(next, typed.size, hazardSet);
      if (next === typed.goal) {
        status = "WON";
      } else if (nextPath.length - 1 >= typed.maxMoves) {
        status = "LOST";
      }
    }

    return {
      ok: true,
      progressState: {
        path: nextPath,
        moveCount: nextPath.length - 1,
        status,
        hints: nextHints,
      },
      data: {
        ok: true,
        game: "safe-path-fog",
        path: nextPath,
        hints: nextHints,
        moveCount: nextPath.length - 1,
        status,
        won: status === "WON",
        lost: status === "LOST",
        exploded,
        currentIndex: next,
      },
    };
  }

  if (gameKey === "signal-hunt") {
    const typed = challenge as SignalHuntChallenge;
    if (!Array.isArray(typed?.stream) || !Array.isArray(typed?.targetPair)) {
      return { ok: false, status: 422, error: "Invalid signal hunt challenge." };
    }
    const progress = normalizeSignalProgress(progressState, typed);
    const action = String(body?.action || "next");

    if (action === "next") {
      if (progress.capturedAt != null) {
        return { ok: false, status: 409, error: "This signal run is already complete." };
      }
      if (progress.index >= typed.stream.length) {
        return {
          ok: true,
          progressState: { ...progress },
          data: {
            ok: true,
            game: "signal-hunt",
            revealed: progress.revealed,
            index: progress.index,
            exhausted: true,
          },
        };
      }
      const nextIndex = progress.index + 1;
      const nextRevealed = typed.stream.slice(0, nextIndex);
      return {
        ok: true,
        progressState: { index: nextIndex, revealed: nextRevealed, capturedAt: progress.capturedAt },
        data: {
          ok: true,
          game: "signal-hunt",
          revealed: nextRevealed,
          currentSymbol: typed.stream[nextIndex - 1],
          index: nextIndex,
          exhausted: nextIndex >= typed.stream.length,
        },
      };
    }

    if (action === "capture") {
      if (progress.capturedAt != null) {
        return { ok: false, status: 409, error: "Signal already captured." };
      }
      if (progress.index < 2) {
        return { ok: false, status: 422, error: "Reveal a little more of the feed first." };
      }
      return {
        ok: true,
        progressState: { ...progress, capturedAt: progress.index },
        data: {
          ok: true,
          game: "signal-hunt",
          capturedAt: progress.index,
          revealed: progress.revealed,
          index: progress.index,
        },
      };
    }

    return { ok: false, status: 422, error: "Unsupported signal action." };
  }

  return { ok: false, status: 409, error: "This game does not use next hidden-state progress." };
}

export function verifyNextHiddenStateAttempt(
  gameKey: NextHiddenStateGameKey,
  challenge: AdditionalVerifiedChallenge,
  meta: Record<string, any>,
  serverElapsedMs: number,
  progressState?: unknown,
): VerificationResult {
  if (gameKey === "progressive-mosaic") {
    const typed = challenge as ProgressiveMosaicChallenge;
    const progress = progressState && typeof progressState === "object" ? (progressState as Record<string, any>) : {};
    const revealed = clampInt(progress.revealed, 0, typed.reveals.length);
    const selectedId = String(meta?.selectedId || "");
    if (!selectedId) return { valid: false, scoreMs: 0, flags: { reason: "missing_selection" } };
    const solved = selectedId === typed.answerId;
    if (!solved) {
      return { valid: true, scoreMs: 0, flags: { solved: false, revealed } };
    }
    const elapsed = sanitizedElapsed(serverElapsedMs, Math.max(1200, 700 + revealed * 350));
    const scoreMs = Math.max(1200, PROGRESSIVE_MOSAIC_MAX_SCORE - elapsed.elapsedMs - revealed * 3200);
    return { valid: true, scoreMs, flags: { solved: true, revealed, elapsedMs: elapsed.elapsedMs, timingNote: elapsed.reason } };
  }

  if (gameKey === "clue-ladder") {
    const typed = challenge as ClueLadderChallenge;
    const progress = progressState && typeof progressState === "object" ? (progressState as Record<string, any>) : {};
    const revealed = clampInt(progress.revealed, 0, typed.clues.length);
    const selectedId = String(meta?.selectedId || "");
    if (!selectedId) return { valid: false, scoreMs: 0, flags: { reason: "missing_selection" } };
    const solved = selectedId === typed.answerId;
    if (!solved) {
      return { valid: true, scoreMs: 0, flags: { solved: false, revealed } };
    }
    const elapsed = sanitizedElapsed(serverElapsedMs, Math.max(1300, 800 + revealed * 300));
    const scoreMs = Math.max(1200, CLUE_LADDER_MAX_SCORE - elapsed.elapsedMs - Math.max(0, revealed - 1) * 2600);
    return { valid: true, scoreMs, flags: { solved: true, revealed, elapsedMs: elapsed.elapsedMs, timingNote: elapsed.reason } };
  }

  if (gameKey === "safe-path-fog") {
    const typed = challenge as SafePathFogChallenge;
    const evaluated = evaluateSafePathProgress(typed, progressState);
    if (!evaluated.valid) {
      return { valid: false, scoreMs: 0, flags: { reason: evaluated.error } };
    }
    if (evaluated.status === "RUNNING") {
      return { valid: false, scoreMs: 0, flags: { reason: "attempt_not_complete" } };
    }
    if (evaluated.status === "LOST") {
      return { valid: true, scoreMs: 0, flags: { solved: false, status: "LOST", moveCount: evaluated.moveCount } };
    }
    const elapsed = sanitizedElapsed(serverElapsedMs, Math.max(1500, 700 + evaluated.moveCount * 220));
    const scoreMs = Math.max(1200, SAFE_PATH_FOG_MAX_SCORE - elapsed.elapsedMs - evaluated.moveCount * 650);
    return {
      valid: true,
      scoreMs,
      flags: { solved: true, status: "WON", moveCount: evaluated.moveCount, elapsedMs: elapsed.elapsedMs, timingNote: elapsed.reason },
    };
  }

  if (gameKey === "signal-hunt") {
    const typed = challenge as SignalHuntChallenge;
    const progress = normalizeSignalProgress(progressState, typed);
    if (!sameArray(progress.revealed, typed.stream.slice(0, progress.index))) {
      return { valid: false, scoreMs: 0, flags: { reason: "revealed_feed_tampered" } };
    }
    const expectedCapture = expectedSignalCaptureAt(typed);
    if (progress.capturedAt == null) {
      if (progress.index < typed.stream.length) {
        return { valid: false, scoreMs: 0, flags: { reason: "attempt_not_complete" } };
      }
      return { valid: true, scoreMs: 0, flags: { solved: false, reason: "feed_exhausted_without_capture" } };
    }
    if (progress.capturedAt !== expectedCapture) {
      return {
        valid: true,
        scoreMs: 0,
        flags: { solved: false, reason: "wrong_capture", expectedCaptureAt: expectedCapture, capturedAt: progress.capturedAt },
      };
    }
    const elapsed = sanitizedElapsed(serverElapsedMs, Math.max(1200, 500 + progress.capturedAt * 250));
    const scoreMs = Math.max(1200, SIGNAL_HUNT_MAX_SCORE - elapsed.elapsedMs - Math.max(0, progress.capturedAt - 2) * 400);
    return {
      valid: true,
      scoreMs,
      flags: {
        solved: true,
        capturedAt: progress.capturedAt,
        expectedCaptureAt: expectedCapture,
        elapsedMs: elapsed.elapsedMs,
        timingNote: elapsed.reason,
      },
    };
  }

  return { valid: false, scoreMs: 0, flags: { reason: "unsupported_next_hidden_state_game" } };
}
