import { randomInt } from "crypto";

export const VERIFIED_GAME_KEYS = [
  "route-builder",
  "codebreaker",
  "rule-lock",
  "transform-memory",
  "sequence-restore",
  "balance-grid",
  "pattern-match",
  "spot-the-missing",
] as const;

export type VerifiedGameKey = (typeof VERIFIED_GAME_KEYS)[number];

type RouteBuilderChallenge = {
  game: "route-builder";
  path: number[];
  checkpoints: number[];
  blockers: number[];
};

type CodebreakerChallenge = {
  game: "codebreaker";
  solution: number[];
};

type RuleLockChallenge = {
  game: "rule-lock";
  symbols: Array<{ id: string; label: string }>;
  constraints: {
    upperId: string;
    lowerId: string;
    fixedId: string;
    fixedSlot: number;
    pairA: string;
    pairB: string;
    notEdgeId: string;
  };
  rules: Array<{ id: string; text: string }>;
};

type TransformMemoryChallenge = {
  game: "transform-memory";
  ruleId: "rotate-right" | "mirror-horizontal" | "mirror-vertical";
  ruleLabel: string;
  basePattern: number[];
};

type SequenceRestoreChallenge = {
  game: "sequence-restore";
  ordered: string[];
  shuffled: string[];
};

type BalanceGridChallenge = {
  game: "balance-grid";
  board: number[];
  targetSum: number;
  solution: number[];
};

type PatternMatchChallenge = {
  game: "pattern-match";
  ordered: string[];
  options: string[][];
  correctIndex: number;
};

type SpotTheMissingChallenge = {
  game: "spot-the-missing";
  shown: string[];
  remaining: string[];
  missing: string;
  options: string[];
};

export type VerifiedChallenge =
  | RouteBuilderChallenge
  | CodebreakerChallenge
  | RuleLockChallenge
  | TransformMemoryChallenge
  | SequenceRestoreChallenge
  | BalanceGridChallenge
  | PatternMatchChallenge
  | SpotTheMissingChallenge;

type VerificationResult = {
  valid: boolean;
  scoreMs: number;
  flags: Record<string, any>;
};

const ROUTE_GRID_SIZE = 6;
const ROUTE_MAX_SCORE = 26000;
const CODE_DIGIT_POOL = [1, 2, 3, 4, 5, 6];
const CODE_LENGTH = 4;
const CODE_MAX_GUESSES = 6;
const CODE_MAX_SCORE = 26000;
const RULE_LOCK_MAX_SCORE = 23000;
const RULE_LOCK_MAX_CHECKS = 3;
const TRANSFORM_GRID_SIZE = 4;
const TRANSFORM_ACTIVE_COUNT = 5;
const TRANSFORM_MAX_SCORE = 24000;
const TRANSFORM_SHOW_MS = 2200;
const SEQUENCE_TOKENS = ["Pick", "Play", "PwnIt", "Prize", "Bonus", "Boost", "Credit", "Target", "Podium", "Voucher", "Unlock", "Winner"];
const SEQUENCE_SHOW_MS = 2300;
const SEQUENCE_MAX_SCORE = 23000;
const BALANCE_GRID_SIZE = 3;
const BALANCE_MAX_SCORE = 22000;
const PATTERN_MAX_SCORE = 22000;
const SPOT_MISSING_MAX_SCORE = 21000;
const PWNIT_WORD_BANK = ["Pick", "Play", "PwnIt", "Prize", "Bonus", "Credit", "Boost", "Target", "Podium", "Voucher", "Unlock", "Winner"];

const ROUTE_PATH_TEMPLATES: number[][] = [
  [0, 1, 2, 8, 14, 15, 16, 22, 28, 29, 35],
  [0, 6, 12, 13, 14, 20, 26, 27, 28, 34, 35],
  [0, 1, 7, 13, 19, 20, 21, 22, 28, 34, 35],
  [0, 6, 7, 8, 14, 20, 26, 32, 33, 34, 35],
  [0, 1, 2, 3, 9, 15, 21, 27, 28, 29, 35],
  [0, 6, 12, 18, 19, 20, 26, 32, 33, 34, 35],
];

const RULE_SYMBOLS: Array<{ id: string; label: string }> = [
  { id: "pick", label: "Pick" },
  { id: "play", label: "Play" },
  { id: "prize", label: "Prize" },
  { id: "bonus", label: "Bonus" },
  { id: "boost", label: "Boost" },
];

const TRANSFORM_RULES = {
  "rotate-right": {
    label: "Rotate the pattern 90° clockwise.",
    apply: (cells: number[]) =>
      cells.map((cell) => {
        const x = cell % TRANSFORM_GRID_SIZE;
        const y = Math.floor(cell / TRANSFORM_GRID_SIZE);
        return x * TRANSFORM_GRID_SIZE + (TRANSFORM_GRID_SIZE - 1 - y);
      }),
  },
  "mirror-horizontal": {
    label: "Mirror the pattern left to right.",
    apply: (cells: number[]) =>
      cells.map((cell) => {
        const x = cell % TRANSFORM_GRID_SIZE;
        const y = Math.floor(cell / TRANSFORM_GRID_SIZE);
        return y * TRANSFORM_GRID_SIZE + (TRANSFORM_GRID_SIZE - 1 - x);
      }),
  },
  "mirror-vertical": {
    label: "Mirror the pattern top to bottom.",
    apply: (cells: number[]) =>
      cells.map((cell) => {
        const x = cell % TRANSFORM_GRID_SIZE;
        const y = Math.floor(cell / TRANSFORM_GRID_SIZE);
        return (TRANSFORM_GRID_SIZE - 1 - y) * TRANSFORM_GRID_SIZE + x;
      }),
  },
} as const;

function shuffle<T>(values: readonly T[]) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function clampInt(value: unknown, min: number, max: number) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function sameArray(a: unknown[], b: unknown[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function sameNumberSet(a: number[], b: number[]) {
  const left = [...a].sort((x, y) => x - y);
  const right = [...b].sort((x, y) => x - y);
  return sameArray(left, right);
}

function isAdjacent(a: number, b: number) {
  const ax = a % ROUTE_GRID_SIZE;
  const ay = Math.floor(a / ROUTE_GRID_SIZE);
  const bx = b % ROUTE_GRID_SIZE;
  const by = Math.floor(b / ROUTE_GRID_SIZE);
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
}

function buildRouteBuilderChallenge(): RouteBuilderChallenge {
  const path = ROUTE_PATH_TEMPLATES[randomInt(ROUTE_PATH_TEMPLATES.length)]!;
  const blockers = shuffle(
    Array.from({ length: ROUTE_GRID_SIZE * ROUTE_GRID_SIZE }, (_, index) => index).filter((cell) => !path.includes(cell)),
  ).slice(0, 10);

  return {
    game: "route-builder",
    path,
    checkpoints: [path[2]!, path[5]!, path[8]!],
    blockers,
  };
}

function buildCodebreakerChallenge(): CodebreakerChallenge {
  return {
    game: "codebreaker",
    solution: shuffle(CODE_DIGIT_POOL).slice(0, CODE_LENGTH),
  };
}

function buildRuleLockChallenge(): RuleLockChallenge {
  const arranged = shuffle(RULE_SYMBOLS);
  const ids = arranged.map((symbol) => symbol.id);
  const labels = new Map(arranged.map((symbol) => [symbol.id, symbol.label]));
  const slotOf = (id: string) => ids.indexOf(id);

  const upperId = ids[0]!;
  const lowerId = ids[2]!;
  const fixedId = ids[4]!;
  const pairA = ids[1]!;
  const pairB = ids[2]!;
  const notEdgeId = ids[3]!;

  return {
    game: "rule-lock",
    symbols: arranged.map((symbol) => ({ ...symbol })),
    constraints: {
      upperId,
      lowerId,
      fixedId,
      fixedSlot: slotOf(fixedId),
      pairA,
      pairB,
      notEdgeId,
    },
    rules: [
      {
        id: "above-below",
        text: `${labels.get(upperId)} must be above ${labels.get(lowerId)}.`,
      },
      {
        id: "fixed-slot",
        text: `${labels.get(fixedId)} must be in slot ${slotOf(fixedId) + 1}.`,
      },
      {
        id: "adjacent-pair",
        text: `${labels.get(pairA)} must sit directly next to ${labels.get(pairB)}.`,
      },
      {
        id: "not-edge",
        text: `${labels.get(notEdgeId)} cannot be in the top or bottom slot.`,
      },
    ],
  };
}

function buildTransformMemoryChallenge(): TransformMemoryChallenge {
  const ruleId = shuffle(Object.keys(TRANSFORM_RULES) as Array<keyof typeof TRANSFORM_RULES>)[0]!;
  return {
    game: "transform-memory",
    ruleId,
    ruleLabel: TRANSFORM_RULES[ruleId].label,
    basePattern: shuffle(Array.from({ length: TRANSFORM_GRID_SIZE * TRANSFORM_GRID_SIZE }, (_, index) => index))
      .slice(0, TRANSFORM_ACTIVE_COUNT)
      .sort((a, b) => a - b),
  };
}

function buildSequenceRestoreChallenge(): SequenceRestoreChallenge {
  const ordered = shuffle(SEQUENCE_TOKENS).slice(0, 5);
  return {
    game: "sequence-restore",
    ordered,
    shuffled: shuffle(ordered),
  };
}

function buildPermutations(values: number[]): number[][] {
  if (values.length <= 1) return [values];
  const output: number[][] = [];
  for (let i = 0; i < values.length; i += 1) {
    const current = values[i]!;
    const rest = [...values.slice(0, i), ...values.slice(i + 1)];
    for (const tail of buildPermutations(rest)) {
      output.push([current, ...tail]);
    }
  }
  return output;
}

const COLUMN_PERMUTATIONS = buildPermutations([0, 1, 2]);

function sumForSelection(board: number[], cells: number[]) {
  return cells.reduce((sum, cell) => sum + board[cell]!, 0);
}

function buildBalanceGridChallenge(): BalanceGridChallenge {
  for (let tries = 0; tries < 60; tries += 1) {
    const board = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const candidates = COLUMN_PERMUTATIONS.map((perm) => ({
      cells: perm.map((col, row) => row * BALANCE_GRID_SIZE + col),
    })).map((entry) => ({ ...entry, total: sumForSelection(board, entry.cells) }));
    const unique = candidates.filter((candidate) => candidates.filter((other) => other.total === candidate.total).length === 1);
    if (!unique.length) continue;
    const picked = unique[randomInt(unique.length)]!;
    return {
      game: "balance-grid",
      board,
      targetSum: picked.total,
      solution: picked.cells,
    };
  }

  return {
    game: "balance-grid",
    board: [8, 1, 6, 3, 5, 7, 4, 9, 2],
    targetSum: 15,
    solution: [0, 4, 8],
  };
}

function buildPatternMatchChallenge(): PatternMatchChallenge {
  const ordered = shuffle(PWNIT_WORD_BANK).slice(0, 4);
  const distractorA = [...ordered];
  [distractorA[1], distractorA[2]] = [distractorA[2]!, distractorA[1]!];
  const distractorB = [...ordered];
  [distractorB[0], distractorB[3]] = [distractorB[3]!, distractorB[0]!];
  const options = shuffle([ordered, distractorA, distractorB]);
  return {
    game: "pattern-match",
    ordered,
    options,
    correctIndex: options.findIndex((entry) => entry.every((word, index) => word === ordered[index])),
  };
}

function buildSpotTheMissingChallenge(): SpotTheMissingChallenge {
  const shown = shuffle(PWNIT_WORD_BANK).slice(0, 6);
  const missingIndex = randomInt(shown.length);
  const missing = shown[missingIndex]!;
  const remaining = shown.filter((_, index) => index !== missingIndex);
  const distractors = shuffle(PWNIT_WORD_BANK.filter((word) => !shown.includes(word))).slice(0, 3);
  return {
    game: "spot-the-missing",
    shown,
    remaining,
    missing,
    options: shuffle([missing, ...distractors]),
  };
}

export function buildVerifiedChallenge(gameKey: VerifiedGameKey): VerifiedChallenge {
  switch (gameKey) {
    case "route-builder":
      return buildRouteBuilderChallenge();
    case "codebreaker":
      return buildCodebreakerChallenge();
    case "rule-lock":
      return buildRuleLockChallenge();
    case "transform-memory":
      return buildTransformMemoryChallenge();
    case "sequence-restore":
      return buildSequenceRestoreChallenge();
    case "balance-grid":
      return buildBalanceGridChallenge();
    case "pattern-match":
      return buildPatternMatchChallenge();
    case "spot-the-missing":
      return buildSpotTheMissingChallenge();
    default:
      throw new Error(`Unhandled verified game key: ${String(gameKey)}`);
  }
}

function sanitizedElapsed(metaElapsed: unknown, serverElapsedMs: number, minMs: number) {
  const clientElapsed = clampInt(metaElapsed, 0, serverElapsedMs + 5_000);
  if (clientElapsed > serverElapsedMs + 1_500) {
    return { valid: false, elapsedMs: serverElapsedMs, reason: "client_elapsed_exceeds_server_window" };
  }
  return {
    valid: true,
    elapsedMs: Math.max(minMs, clientElapsed),
    reason: clientElapsed < minMs ? "elapsed_clamped_to_plausible_minimum" : null,
  };
}

function verifyRouteBuilder(challenge: RouteBuilderChallenge, meta: Record<string, any>, serverElapsedMs: number): VerificationResult {
  const clickLog = Array.isArray(meta?.clickLog)
    ? meta.clickLog.map((value: unknown) => clampInt(value, -1, 35)).filter((value: number) => value >= 0)
    : [];
  if (!clickLog.length) {
    return { valid: false, scoreMs: 0, flags: { reason: "missing_click_log" } };
  }

  let trail = [challenge.path[0]!];
  let mistakes = 0;
  let solved = false;

  for (const cell of clickLog) {
    const current = trail[trail.length - 1]!;
    if (challenge.blockers.includes(cell)) {
      mistakes += 1;
      continue;
    }
    if (cell === current) continue;
    if (trail.length > 1 && cell === trail[trail.length - 2]) {
      trail = trail.slice(0, -1);
      continue;
    }
    if (!isAdjacent(current, cell)) {
      mistakes += 1;
      continue;
    }
    trail = [...trail, cell];
    const checkpointsCleared = challenge.checkpoints.every((checkpoint) => trail.includes(checkpoint));
    if (cell === challenge.path[challenge.path.length - 1] && checkpointsCleared) {
      solved = true;
      break;
    }
  }

  if (!solved) {
    return { valid: true, scoreMs: 0, flags: { solved: false, mistakes, completed: false } };
  }

  const elapsed = sanitizedElapsed(meta?.elapsedMs, serverElapsedMs, Math.max(1700, clickLog.length * 160));
  if (!elapsed.valid) {
    return { valid: false, scoreMs: 0, flags: { reason: elapsed.reason } };
  }

  const extraSteps = Math.max(0, trail.length - challenge.path.length);
  const scoreMs = Math.max(1000, ROUTE_MAX_SCORE - elapsed.elapsedMs - mistakes * 700 - extraSteps * 320);
  return {
    valid: true,
    scoreMs,
    flags: {
      solved: true,
      mistakes,
      extraSteps,
      elapsedMs: elapsed.elapsedMs,
      timingNote: elapsed.reason,
      clickCount: clickLog.length,
    },
  };
}

function gradeGuess(guess: number[], solution: number[]) {
  let exact = 0;
  let misplaced = 0;
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    if (guess[i] === solution[i]) exact += 1;
    else if (solution.includes(guess[i]!)) misplaced += 1;
  }
  return { exact, misplaced };
}

function verifyCodebreaker(challenge: CodebreakerChallenge, meta: Record<string, any>, serverElapsedMs: number): VerificationResult {
  const rawRows = Array.isArray(meta?.guessLog) ? meta.guessLog : [];
  if (!rawRows.length || rawRows.length > CODE_MAX_GUESSES) {
    return { valid: false, scoreMs: 0, flags: { reason: "invalid_guess_log_length" } };
  }

  let solvedAtGuess = 0;
  for (let index = 0; index < rawRows.length; index += 1) {
    const row = rawRows[index] || {};
    const value: number[] = Array.isArray(row.value) ? row.value.map((n: unknown) => clampInt(n, 0, 9)) : [];
    if (value.length !== CODE_LENGTH || new Set(value).size !== CODE_LENGTH || value.some((n: number) => !CODE_DIGIT_POOL.includes(n))) {
      return { valid: false, scoreMs: 0, flags: { reason: "invalid_guess_shape", guessIndex: index } };
    }
    const graded = gradeGuess(value, challenge.solution);
    if (Number(row.exact) !== graded.exact || Number(row.misplaced) !== graded.misplaced) {
      return { valid: false, scoreMs: 0, flags: { reason: "feedback_mismatch", guessIndex: index } };
    }
    if (graded.exact === CODE_LENGTH) {
      solvedAtGuess = index + 1;
      if (index !== rawRows.length - 1) {
        return { valid: false, scoreMs: 0, flags: { reason: "extra_guesses_after_solution" } };
      }
    }
  }

  if (!solvedAtGuess) {
    return { valid: true, scoreMs: 0, flags: { solved: false, guessesUsed: rawRows.length } };
  }

  const elapsed = sanitizedElapsed(meta?.elapsedMs, serverElapsedMs, Math.max(1800, rawRows.length * 400));
  if (!elapsed.valid) {
    return { valid: false, scoreMs: 0, flags: { reason: elapsed.reason } };
  }

  const scoreMs = Math.max(1200, CODE_MAX_SCORE - elapsed.elapsedMs - (solvedAtGuess - 1) * 2600);
  return {
    valid: true,
    scoreMs,
    flags: { solved: true, guessesUsed: solvedAtGuess, elapsedMs: elapsed.elapsedMs, timingNote: elapsed.reason },
  };
}

function evaluateRuleLock(challenge: RuleLockChallenge, slots: string[]) {
  const { constraints } = challenge;
  const aboveBelow = slots.indexOf(constraints.upperId) < slots.indexOf(constraints.lowerId);
  const fixedSlot = slots[constraints.fixedSlot] === constraints.fixedId;
  const adjacentPair = Math.abs(slots.indexOf(constraints.pairA) - slots.indexOf(constraints.pairB)) === 1;
  const notEdge = (() => {
    const idx = slots.indexOf(constraints.notEdgeId);
    return idx > 0 && idx < slots.length - 1;
  })();
  return aboveBelow && fixedSlot && adjacentPair && notEdge;
}

function verifyRuleLock(challenge: RuleLockChallenge, meta: Record<string, any>, serverElapsedMs: number): VerificationResult {
  const placements = Array.isArray(meta?.placements) ? meta.placements.map((value: unknown) => String(value || "")) : [];
  const checksUsed = clampInt(meta?.checksUsed, 0, RULE_LOCK_MAX_CHECKS);
  const symbolIds = challenge.symbols.map((symbol) => symbol.id);
  if (placements.length !== symbolIds.length || new Set(placements).size !== symbolIds.length || placements.some((slot) => !symbolIds.includes(slot))) {
    return { valid: false, scoreMs: 0, flags: { reason: "invalid_placements" } };
  }
  if (checksUsed < 1 || checksUsed > RULE_LOCK_MAX_CHECKS) {
    return { valid: false, scoreMs: 0, flags: { reason: "invalid_checks_used" } };
  }

  const solved = evaluateRuleLock(challenge, placements);
  if (!solved) {
    return { valid: true, scoreMs: 0, flags: { solved: false, checksUsed } };
  }

  const elapsed = sanitizedElapsed(meta?.elapsedMs, serverElapsedMs, Math.max(1600, checksUsed * 450));
  if (!elapsed.valid) {
    return { valid: false, scoreMs: 0, flags: { reason: elapsed.reason } };
  }

  const scoreMs = Math.max(1200, RULE_LOCK_MAX_SCORE - elapsed.elapsedMs - (checksUsed - 1) * 2200);
  return {
    valid: true,
    scoreMs,
    flags: { solved: true, checksUsed, elapsedMs: elapsed.elapsedMs, timingNote: elapsed.reason },
  };
}

function verifyTransformMemory(challenge: TransformMemoryChallenge, meta: Record<string, any>, serverElapsedMs: number): VerificationResult {
  const selected = Array.isArray(meta?.selected)
    ? meta.selected.map((value: unknown) => clampInt(value, -1, 15)).filter((value: number) => value >= 0)
    : [];
  if (selected.length !== TRANSFORM_ACTIVE_COUNT || new Set(selected).size !== TRANSFORM_ACTIVE_COUNT) {
    return { valid: false, scoreMs: 0, flags: { reason: "invalid_selection_shape" } };
  }

  const rule = TRANSFORM_RULES[challenge.ruleId];
  const targetPattern = rule.apply(challenge.basePattern).sort((a, b) => a - b);
  const correct = sameNumberSet(selected, targetPattern);
  if (!correct) {
    return { valid: true, scoreMs: 0, flags: { solved: false, correct: false } };
  }

  const elapsed = sanitizedElapsed(meta?.elapsedMs, serverElapsedMs, 900);
  if (!elapsed.valid) {
    return { valid: false, scoreMs: 0, flags: { reason: elapsed.reason } };
  }

  const scoreMs = Math.max(1200, TRANSFORM_MAX_SCORE - elapsed.elapsedMs);
  return {
    valid: true,
    scoreMs,
    flags: { solved: true, elapsedMs: elapsed.elapsedMs, ruleId: challenge.ruleId, timingNote: elapsed.reason },
  };
}

function verifySequenceRestore(challenge: SequenceRestoreChallenge, meta: Record<string, any>, serverElapsedMs: number): VerificationResult {
  const answer = Array.isArray(meta?.answer) ? meta.answer.map((value: unknown) => String(value || "")) : [];
  if (answer.length !== challenge.ordered.length || [...answer].sort().join("|") !== [...challenge.ordered].sort().join("|")) {
    return { valid: false, scoreMs: 0, flags: { reason: "invalid_answer_payload" } };
  }

  const correct = answer.every((token, index) => token === challenge.ordered[index]);
  if (!correct) {
    return { valid: true, scoreMs: 0, flags: { solved: false, correct: false } };
  }

  const elapsed = sanitizedElapsed(meta?.elapsedMs, serverElapsedMs, 1000);
  if (!elapsed.valid) {
    return { valid: false, scoreMs: 0, flags: { reason: elapsed.reason } };
  }

  const scoreMs = Math.max(1200, SEQUENCE_MAX_SCORE - elapsed.elapsedMs);
  return {
    valid: true,
    scoreMs,
    flags: { solved: true, elapsedMs: elapsed.elapsedMs, timingNote: elapsed.reason },
  };
}

function rowOf(cell: number) {
  return Math.floor(cell / BALANCE_GRID_SIZE);
}

function colOf(cell: number) {
  return cell % BALANCE_GRID_SIZE;
}

function hasUniqueRowsAndCols(cells: number[]) {
  const rows = new Set(cells.map(rowOf));
  const cols = new Set(cells.map(colOf));
  return rows.size === cells.length && cols.size === cells.length;
}

function verifyBalanceGrid(challenge: BalanceGridChallenge, meta: Record<string, any>, serverElapsedMs: number): VerificationResult {
  const selected = Array.isArray(meta?.selected)
    ? meta.selected.map((value: unknown) => clampInt(value, -1, 8)).filter((value: number) => value >= 0)
    : [];
  if (selected.length !== BALANCE_GRID_SIZE || new Set(selected).size !== BALANCE_GRID_SIZE) {
    return { valid: false, scoreMs: 0, flags: { reason: "invalid_selection_shape" } };
  }

  const uniquePlacement = hasUniqueRowsAndCols(selected);
  const total = sumForSelection(challenge.board, selected);
  const correct = uniquePlacement && total === challenge.targetSum;
  if (!correct) {
    return { valid: true, scoreMs: 0, flags: { solved: false, uniquePlacement, total } };
  }

  const elapsed = sanitizedElapsed(meta?.elapsedMs, serverElapsedMs, 900);
  if (!elapsed.valid) {
    return { valid: false, scoreMs: 0, flags: { reason: elapsed.reason } };
  }

  const scoreMs = Math.max(1200, BALANCE_MAX_SCORE - elapsed.elapsedMs);
  return {
    valid: true,
    scoreMs,
    flags: {
      solved: true,
      uniquePlacement,
      total,
      exactSolution: sameNumberSet(selected, challenge.solution),
      elapsedMs: elapsed.elapsedMs,
      timingNote: elapsed.reason,
    },
  };
}

function verifyPatternMatch(challenge: PatternMatchChallenge, meta: Record<string, any>, serverElapsedMs: number): VerificationResult {
  const chosenIndex = clampInt(meta?.chosenIndex, -1, challenge.options.length - 1);
  if (chosenIndex < 0 || chosenIndex >= challenge.options.length) {
    return { valid: false, scoreMs: 0, flags: { reason: "invalid_choice_index" } };
  }

  const chosenOption = challenge.options[chosenIndex]!;
  const correct = chosenIndex === challenge.correctIndex && sameArray(chosenOption, challenge.ordered);
  if (!correct) {
    return { valid: true, scoreMs: 0, flags: { solved: false, correct: false, chosenIndex } };
  }

  const elapsed = sanitizedElapsed(meta?.elapsedMs, serverElapsedMs, 700);
  if (!elapsed.valid) {
    return { valid: false, scoreMs: 0, flags: { reason: elapsed.reason } };
  }

  return {
    valid: true,
    scoreMs: Math.max(1200, PATTERN_MAX_SCORE - elapsed.elapsedMs),
    flags: { solved: true, chosenIndex, elapsedMs: elapsed.elapsedMs, timingNote: elapsed.reason },
  };
}

function verifySpotTheMissing(challenge: SpotTheMissingChallenge, meta: Record<string, any>, serverElapsedMs: number): VerificationResult {
  const chosen = String(meta?.chosen || "");
  if (!challenge.options.includes(chosen)) {
    return { valid: false, scoreMs: 0, flags: { reason: "invalid_missing_choice" } };
  }

  if (chosen !== challenge.missing) {
    return { valid: true, scoreMs: 0, flags: { solved: false, correct: false, chosen } };
  }

  const elapsed = sanitizedElapsed(meta?.elapsedMs, serverElapsedMs, 700);
  if (!elapsed.valid) {
    return { valid: false, scoreMs: 0, flags: { reason: elapsed.reason } };
  }

  return {
    valid: true,
    scoreMs: Math.max(1200, SPOT_MISSING_MAX_SCORE - elapsed.elapsedMs),
    flags: { solved: true, chosen, elapsedMs: elapsed.elapsedMs, timingNote: elapsed.reason },
  };
}

export function verifyVerifiedAttempt(gameKey: VerifiedGameKey, challenge: VerifiedChallenge, meta: Record<string, any>, serverElapsedMs: number): VerificationResult {
  switch (gameKey) {
    case "route-builder":
      return verifyRouteBuilder(challenge as RouteBuilderChallenge, meta, serverElapsedMs);
    case "codebreaker":
      return verifyCodebreaker(challenge as CodebreakerChallenge, meta, serverElapsedMs);
    case "rule-lock":
      return verifyRuleLock(challenge as RuleLockChallenge, meta, serverElapsedMs);
    case "transform-memory":
      return verifyTransformMemory(challenge as TransformMemoryChallenge, meta, serverElapsedMs);
    case "sequence-restore":
      return verifySequenceRestore(challenge as SequenceRestoreChallenge, meta, serverElapsedMs);
    case "balance-grid":
      return verifyBalanceGrid(challenge as BalanceGridChallenge, meta, serverElapsedMs);
    case "pattern-match":
      return verifyPatternMatch(challenge as PatternMatchChallenge, meta, serverElapsedMs);
    case "spot-the-missing":
      return verifySpotTheMissing(challenge as SpotTheMissingChallenge, meta, serverElapsedMs);
    default:
      throw new Error(`Unhandled verified game key: ${String(gameKey)}`);
  }
}

export function isVerifiedGameKey(value: string | null | undefined): value is VerifiedGameKey {
  return VERIFIED_GAME_KEYS.includes(String(value || "") as VerifiedGameKey);
}

export const VERIFIED_GAME_CONSTANTS = {
  sequenceShowMs: SEQUENCE_SHOW_MS,
  transformShowMs: TRANSFORM_SHOW_MS,
};
