export const VERIFIED_GAME_KEYS = [
  "rule-lock",
  "transform-memory",
  "sequence-restore",
  "balance-grid",
  "pattern-match",
  "spot-the-missing",
  "rapid-math-relay",
] as const;

export type VerifiedGameKey = (typeof VERIFIED_GAME_KEYS)[number];

type SymbolDef = { id: string; label: string };

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
  symbols: SymbolDef[];
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

type RapidMathRelayChallenge = {
  game: "rapid-math-relay";
  rounds: Array<{ prompt: string; answer: number }>;
  timeLimitMs: number;
};

export type VerifiedChallenge =
  | RouteBuilderChallenge
  | CodebreakerChallenge
  | RuleLockChallenge
  | TransformMemoryChallenge
  | SequenceRestoreChallenge
  | BalanceGridChallenge
  | PatternMatchChallenge
  | SpotTheMissingChallenge
  | RapidMathRelayChallenge;

export type PublicVerifiedChallenge =
  | RuleLockChallenge
  | TransformMemoryChallenge
  | SequenceRestoreChallenge
  | { game: "balance-grid"; board: number[]; targetSum: number }
  | { game: "pattern-match"; ordered: string[]; options: string[][] }
  | { game: "spot-the-missing"; shown: string[]; remaining: string[]; options: string[] }
  | { game: "rapid-math-relay"; rounds: Array<{ prompt: string }>; timeLimitMs: number };

type VerificationResult = {
  valid: boolean;
  scoreMs: number;
  flags: Record<string, any>;
};

const RULE_LOCK_MAX_SCORE = 23000;
const RULE_LOCK_MAX_CHECKS = 3;
const TRANSFORM_GRID_SIZE = 4;
const TRANSFORM_ACTIVE_COUNT = 5;
const TRANSFORM_MAX_SCORE = 24000;
const SEQUENCE_TOKENS = ["Pick", "Play", "PwnIt", "Prize", "Bonus", "Boost", "Credit", "Target", "Podium", "Voucher", "Unlock", "Winner"];
const SEQUENCE_MAX_SCORE = 23000;
const BALANCE_GRID_SIZE = 3;
const BALANCE_MAX_SCORE = 22000;
const PATTERN_MAX_SCORE = 22000;
const SPOT_MISSING_MAX_SCORE = 21000;
const RAPID_MATH_ROUNDS = 6;
const RAPID_MATH_TIME_LIMIT_MS = 45000;
const RAPID_MATH_MAX_SCORE = 24000;
const PWNIT_WORD_BANK = ["Pick", "Play", "PwnIt", "Prize", "Bonus", "Credit", "Boost", "Target", "Podium", "Voucher", "Unlock", "Winner"] as const;
const PATTERN_TILE_BANK = [...PWNIT_WORD_BANK] as const;
const SYMBOLS: SymbolDef[] = [
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

function shuffle<T>(values: readonly T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function clampInt(value: unknown, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function sameArray<T>(a: T[], b: T[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function sameNumberSet(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const left = [...a].sort((x, y) => x - y);
  const right = [...b].sort((x, y) => x - y);
  return left.every((value, index) => value === right[index]);
}

function isVerifiedChallenge(value: unknown): value is VerifiedChallenge {
  return !!value && typeof value === "object" && typeof (value as any).game === "string";
}

function sanitizedElapsed(_metaElapsed: unknown, serverElapsedMs: number, minMs: number) {
  return {
    valid: true,
    elapsedMs: Math.max(minMs, Math.round(serverElapsedMs)),
    reason: serverElapsedMs < minMs ? "server_elapsed_clamped_to_plausible_minimum" : null,
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


function buildRapidMathQuestion() {
  const op = randomChoice(["+", "-", "×"] as const);
  if (op === "+") {
    const left = randomInt(6, 31);
    const right = randomInt(4, 21);
    return { prompt: `${left} + ${right}`, answer: left + right };
  }
  if (op === "-") {
    const left = randomInt(15, 61);
    const right = randomInt(3, Math.min(26, left));
    return { prompt: `${left} - ${right}`, answer: left - right };
  }
  const left = randomInt(3, 13);
  const right = randomInt(2, 13);
  return { prompt: `${left} × ${right}`, answer: left * right };
}

function buildRapidMathRelayChallenge(): RapidMathRelayChallenge {
  return {
    game: "rapid-math-relay",
    rounds: Array.from({ length: RAPID_MATH_ROUNDS }, () => buildRapidMathQuestion()),
    timeLimitMs: RAPID_MATH_TIME_LIMIT_MS,
  };
}

function buildRuleLockChallenge(): RuleLockChallenge {
  const arranged = shuffle(SYMBOLS);
  const ids = arranged.map((symbol) => symbol.id);
  const getLabel = (id: string) => arranged.find((symbol) => symbol.id === id)?.label ?? id;
  const upperId = ids[0]!;
  const lowerId = ids[2]!;
  const fixedId = ids[3]!;
  const fixedSlot = 4;
  const pairA = ids[1]!;
  const pairB = ids[4]!;
  const notEdgeId = ids[2]!;

  return {
    game: "rule-lock",
    symbols: arranged,
    constraints: {
      upperId,
      lowerId,
      fixedId,
      fixedSlot,
      pairA,
      pairB,
      notEdgeId,
    },
    rules: [
      { id: "above-below", text: `${getLabel(upperId)} must be above ${getLabel(lowerId)}.` },
      { id: "fixed-slot", text: `${getLabel(fixedId)} is locked into slot ${fixedSlot + 1}.` },
      { id: "adjacent-pair", text: `${getLabel(pairA)} must sit directly next to ${getLabel(pairB)}.` },
      { id: "not-edge", text: `${getLabel(notEdgeId)} cannot be in the top or bottom slot.` },
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
    const candidates = COLUMN_PERMUTATIONS.map((perm) => ({ cells: perm.map((col, row) => row * BALANCE_GRID_SIZE + col) }))
      .map((entry) => ({ ...entry, total: sumForSelection(board, entry.cells) }));
    const unique = candidates.filter((candidate) => candidates.filter((other) => other.total === candidate.total).length === 1);
    if (!unique.length) continue;
    const picked = unique[Math.floor(Math.random() * unique.length)]!;
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
  const ordered = shuffle(PATTERN_TILE_BANK).slice(0, 4);
  const distractors = new Set<string>();
  while (distractors.size < 3) {
    const candidate = shuffle(ordered).join("|");
    if (candidate !== ordered.join("|")) distractors.add(candidate);
  }
  const options = shuffle([ordered, ...Array.from(distractors).map((entry) => entry.split("|"))]);
  const correctIndex = options.findIndex((option) => sameArray(option, ordered));
  return {
    game: "pattern-match",
    ordered,
    options,
    correctIndex,
  };
}

function buildSpotTheMissingChallenge(): SpotTheMissingChallenge {
  const shown = shuffle(PWNIT_WORD_BANK).slice(0, 6) as string[];
  const missingIndex = Math.floor(Math.random() * shown.length);
  const missing = shown[missingIndex]!;
  const remaining = shown.filter((_, index) => index !== missingIndex);
  const distractors = shuffle(PWNIT_WORD_BANK.filter((word) => !shown.includes(word))).slice(0, 3) as string[];
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
    case "rapid-math-relay":
      return buildRapidMathRelayChallenge();
    default:
      throw new Error(`Unhandled verified game key: ${String(gameKey)}`);
  }
}

export function buildPublicVerifiedChallenge(gameKeyOrChallenge: VerifiedGameKey | VerifiedChallenge): PublicVerifiedChallenge {
  const challenge = typeof gameKeyOrChallenge === "string" ? buildVerifiedChallenge(gameKeyOrChallenge) : gameKeyOrChallenge;
  switch (challenge.game) {
    case "rule-lock":
    case "transform-memory":
    case "sequence-restore":
      return challenge;
    case "balance-grid":
      return { game: challenge.game, board: challenge.board, targetSum: challenge.targetSum };
    case "pattern-match":
      return { game: challenge.game, ordered: challenge.ordered, options: challenge.options };
    case "spot-the-missing":
      return { game: challenge.game, shown: challenge.shown, remaining: challenge.remaining, options: challenge.options };
    case "rapid-math-relay":
      return { game: challenge.game, rounds: challenge.rounds.map((round) => ({ prompt: round.prompt })), timeLimitMs: challenge.timeLimitMs };
    default:
      throw new Error(`Unhandled public verified game key: ${String((challenge as any).game)}`);
  }
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
  const scoreMs = Math.max(1200, SEQUENCE_MAX_SCORE - elapsed.elapsedMs);
  return {
    valid: true,
    scoreMs,
    flags: { solved: true, elapsedMs: elapsed.elapsedMs, timingNote: elapsed.reason },
  };
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
    return { valid: true, scoreMs: 0, flags: { solved: false, correct: false, uniquePlacement, total } };
  }
  const elapsed = sanitizedElapsed(meta?.elapsedMs, serverElapsedMs, 900);
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
  return {
    valid: true,
    scoreMs: Math.max(1200, SPOT_MISSING_MAX_SCORE - elapsed.elapsedMs),
    flags: { solved: true, chosen, elapsedMs: elapsed.elapsedMs, timingNote: elapsed.reason },
  };
}


function verifyRapidMathRelay(challenge: RapidMathRelayChallenge, meta: Record<string, any>, serverElapsedMs: number): VerificationResult {
  const answers = Array.isArray(meta?.answers)
    ? meta.answers.map((value: unknown) => String(value ?? "").trim())
    : [];
  if (answers.length !== challenge.rounds.length) {
    return { valid: false, scoreMs: 0, flags: { reason: "invalid_answer_count" } };
  }

  const normalizedExpected = challenge.rounds.map((round) => String(round.answer));
  const correctCount = answers.reduce((count, value, index) => count + (value === normalizedExpected[index] ? 1 : 0), 0);
  const wrongCount = answers.length - correctCount;
  const elapsed = sanitizedElapsed(meta?.elapsedMs, serverElapsedMs, Math.max(2800, challenge.rounds.length * 700));

  const speedBonus = Math.max(0, 12000 - elapsed.elapsedMs);
  const scoreMs = Math.max(
    0,
    Math.min(
      RAPID_MATH_MAX_SCORE,
      correctCount * 2800 + speedBonus - wrongCount * 1000,
    ),
  );

  return {
    valid: true,
    scoreMs,
    flags: {
      solved: correctCount === challenge.rounds.length,
      correctCount,
      wrongCount,
      elapsedMs: elapsed.elapsedMs,
      timingNote: elapsed.reason,
    },
  };
}


export function isVerifiedGameKey(gameKey: string): gameKey is VerifiedGameKey {
  return (VERIFIED_GAME_KEYS as readonly string[]).includes(gameKey);
}

export function verifyVerifiedAttempt(
  gameKey: VerifiedGameKey,
  challenge: unknown,
  meta: Record<string, any>,
  serverElapsedMs: number,
): VerificationResult {
  if (!isVerifiedChallenge(challenge)) {
    return { valid: false, scoreMs: 0, flags: { reason: "invalid_server_challenge" } };
  }

  switch (gameKey) {
    case "rule-lock":
      if (challenge.game !== "rule-lock") return { valid: false, scoreMs: 0, flags: { reason: "challenge_game_mismatch" } };
      return verifyRuleLock(challenge, meta, serverElapsedMs);
    case "transform-memory":
      if (challenge.game !== "transform-memory") return { valid: false, scoreMs: 0, flags: { reason: "challenge_game_mismatch" } };
      return verifyTransformMemory(challenge, meta, serverElapsedMs);
    case "sequence-restore":
      if (challenge.game !== "sequence-restore") return { valid: false, scoreMs: 0, flags: { reason: "challenge_game_mismatch" } };
      return verifySequenceRestore(challenge, meta, serverElapsedMs);
    case "balance-grid":
      if (challenge.game !== "balance-grid") return { valid: false, scoreMs: 0, flags: { reason: "challenge_game_mismatch" } };
      return verifyBalanceGrid(challenge, meta, serverElapsedMs);
    case "pattern-match":
      if (challenge.game !== "pattern-match") return { valid: false, scoreMs: 0, flags: { reason: "challenge_game_mismatch" } };
      return verifyPatternMatch(challenge, meta, serverElapsedMs);
    case "spot-the-missing":
      if (challenge.game !== "spot-the-missing") return { valid: false, scoreMs: 0, flags: { reason: "challenge_game_mismatch" } };
      return verifySpotTheMissing(challenge, meta, serverElapsedMs);
    case "rapid-math-relay":
      if (challenge.game !== "rapid-math-relay") return { valid: false, scoreMs: 0, flags: { reason: "challenge_game_mismatch" } };
      return verifyRapidMathRelay(challenge, meta, serverElapsedMs);
    default:
      return { valid: false, scoreMs: 0, flags: { reason: "unsupported_verified_game" } };
  }
}
