// Deterministic FIVE-DISCIPLINE GAUNTLET engine for PwnIt 2, shared by client + server.
// PURE — no Node-only imports — so both sides derive identical rounds from one seed.
//
// Rounds cycle by index (% 5):
//   0 -> "memory"   watch a growing colour-pad sequence, tap it back
//   1 -> "search"   Schulte grid: tap the numbers 1..K in order
//   2 -> "math"     tap the correct answer to a short chain of problems
//   3 -> "stroop"   tap the INK COLOUR of a colour-word (not the word) — attention/inhibition
//   4 -> "pattern"  "what comes next": tap the next term in a short logical sequence
//
// math, stroop and pattern share one interaction: a chain of multiple-choice "items",
// each with `options` and a `correct` index. Memory/search keep their bespoke inputs.
// A round is cleared only if its submitted inputs exactly equal that round's solution.
// roundsCleared = leading rounds fully cleared. The server re-derives every round
// (including the maths answers, the Stroop ink, and the pattern's next term) from the
// signed seed and never trusts a client score. Difficulty rises once per full cycle
// (every 5 rounds); time is only a tie-breaker.

export type Discipline = "memory" | "search" | "math" | "stroop" | "pattern";
export type Pwnit2ChoiceKind = "math" | "stroop" | "pattern";

// One multiple-choice item. `options` are numeric payloads:
//   math/pattern -> the numbers shown on the option buttons
//   stroop       -> colour indices into PWNIT2_STROOP_COLORS (rendered as swatches)
// `correct` is the index into `options` of the right answer.
export type Pwnit2ChoiceItem = {
  kind: Pwnit2ChoiceKind;
  options: number[];
  correct: number;
  text?: string; // math: the equation
  sequence?: number[]; // pattern: the shown terms
  wordColorIndex?: number; // stroop: palette index for the WORD label
  inkColorIndex?: number; // stroop: palette index for the INK (the answer)
};
// Back-compat alias (older imports).
export type Pwnit2MathProblem = Pwnit2ChoiceItem;

export const PWNIT2_STROOP_COLORS: { name: string; hex: string }[] = [
  { name: "RED", hex: "#ef4444" },
  { name: "BLUE", hex: "#3b82f6" },
  { name: "GREEN", hex: "#22c55e" },
  { name: "YELLOW", hex: "#eab308" },
  { name: "PURPLE", hex: "#a855f7" },
  { name: "ORANGE", hex: "#f97316" },
];

export type Pwnit2GauntletConfig = {
  maxRounds: number;
  // memory
  memBase: number;
  memSymbols: number;
  memFlashMs: number;
  memGapMs: number;
  memInputBaseMs: number;
  memInputPerSymbolMs: number;
  memInputMinMs: number;
  // search
  searchBase: number;
  gridCols: number;
  gridRows: number;
  searchInputBaseMs: number;
  searchInputPerTargetMs: number;
  searchInputMinMs: number;
  // math
  mathBase: number;
  mathOptions: number;
  mathInputBaseMs: number;
  mathInputPerProblemMs: number;
  mathInputMinMs: number;
  // stroop
  stroopBase: number;
  stroopOptions: number;
  stroopInputBaseMs: number;
  stroopInputPerItemMs: number;
  stroopInputMinMs: number;
  // pattern
  patternBase: number;
  patternOptions: number;
  patternShown: number;
  patternInputBaseMs: number;
  patternInputPerItemMs: number;
  patternInputMinMs: number;
};

export const PWNIT2_GAUNTLET_CONFIG: Pwnit2GauntletConfig = {
  maxRounds: 45,
  memBase: 3,
  memSymbols: 4,
  memFlashMs: 560,
  memGapMs: 240,
  memInputBaseMs: 3000,
  memInputPerSymbolMs: 1100,
  memInputMinMs: 6000,
  searchBase: 5,
  gridCols: 5,
  gridRows: 5,
  searchInputBaseMs: 4000,
  searchInputPerTargetMs: 900,
  searchInputMinMs: 7000,
  mathBase: 3,
  mathOptions: 4,
  mathInputBaseMs: 4000,
  mathInputPerProblemMs: 3200,
  mathInputMinMs: 8000,
  stroopBase: 4,
  stroopOptions: 4,
  stroopInputBaseMs: 3000,
  stroopInputPerItemMs: 1500,
  stroopInputMinMs: 7000,
  patternBase: 3,
  patternOptions: 4,
  patternShown: 4,
  patternInputBaseMs: 4000,
  patternInputPerItemMs: 3200,
  patternInputMinMs: 8000,
};

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Independent deterministic RNG per (seed, round, salt). Salt separates disciplines / sub-items.
function rngFor(seed: number, roundIndex: number, salt: number) {
  const s =
    (Math.imul((seed ^ 0x9e3779b9) >>> 0, 0x85ebca6b) ^
      Math.imul(roundIndex * 2 + 1, 0xc2b2ae35) ^
      Math.imul(salt + 1, 0x27d4eb2f)) >>>
    0;
  return mulberry32(s);
}

export function disciplineForRound(roundIndex: number): Discipline {
  const m = Math.max(0, roundIndex) % 5;
  return m === 0 ? "memory" : m === 1 ? "search" : m === 2 ? "math" : m === 3 ? "stroop" : "pattern";
}

// Full cycles completed by this round — drives difficulty growth.
function cycle(roundIndex: number): number {
  return Math.floor(Math.max(0, roundIndex) / 5);
}

// Build N distinct, non-negative integer options that include `answer`, then shuffle.
function buildNumberOptions(rnd: () => number, answer: number, optionCount: number): { options: number[]; correct: number } {
  const opts: number[] = [answer];
  const deltas = [1, -1, 2, -2, 3, -3, 5, -5, 4, -4, 10, -10];
  let di = 0;
  while (opts.length < optionCount && di < deltas.length * 4) {
    const base = deltas[di % deltas.length];
    const jitter = di >= deltas.length ? Math.floor(rnd() * 5) - 2 : 0;
    const cand = answer + base + jitter;
    if (cand >= 0 && !opts.includes(cand)) opts.push(cand);
    di += 1;
  }
  let pad = 11;
  while (opts.length < optionCount) {
    const cand = answer + pad;
    if (!opts.includes(cand)) opts.push(cand);
    pad += 1;
  }
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = opts[i];
    opts[i] = opts[j];
    opts[j] = t;
  }
  return { options: opts, correct: opts.indexOf(answer) };
}

// ── Memory discipline ─────────────────────────────────────────────────────────
export function memoryLength(roundIndex: number, cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG): number {
  return cfg.memBase + cycle(roundIndex);
}
export function memorySequence(
  seed: number,
  roundIndex: number,
  cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG,
): number[] {
  const len = memoryLength(roundIndex, cfg);
  const rnd = rngFor(seed, roundIndex, 1);
  return Array.from({ length: len }, () => Math.floor(rnd() * cfg.memSymbols));
}

// ── Search discipline ───────────────────────────────────────────────────────────
export function searchCount(roundIndex: number, cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG): number {
  const cells = cfg.gridCols * cfg.gridRows;
  return Math.min(cells, cfg.searchBase + cycle(roundIndex));
}
export function searchTargets(
  seed: number,
  roundIndex: number,
  cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG,
): number[] {
  const cells = cfg.gridCols * cfg.gridRows;
  const k = searchCount(roundIndex, cfg);
  const rnd = rngFor(seed, roundIndex, 2);
  const pool = Array.from({ length: cells }, (_, i) => i);
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(rnd() * (cells - i));
    const t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
  }
  return pool.slice(0, k);
}

// ── Math discipline ──────────────────────────────────────────────────────────────
export function mathCount(roundIndex: number, cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG): number {
  return cfg.mathBase + cycle(roundIndex);
}
function buildMathItem(rnd: () => number, tier: number, optionCount: number): Pwnit2ChoiceItem {
  const ops = tier < 1 ? ["+", "-"] : ["+", "-", "x"];
  const op = ops[Math.floor(rnd() * ops.length)];
  let a: number;
  let b: number;
  let ans: number;
  if (op === "x") {
    a = 2 + Math.floor(rnd() * (3 + tier));
    b = 2 + Math.floor(rnd() * (5 + tier));
    ans = a * b;
  } else {
    const hi = 8 + tier * 6;
    a = 1 + Math.floor(rnd() * hi);
    b = 1 + Math.floor(rnd() * hi);
    if (op === "-" && b > a) {
      const t = a;
      a = b;
      b = t;
    }
    ans = op === "+" ? a + b : a - b;
  }
  const text = `${a} ${op === "x" ? "\u00d7" : op} ${b}`;
  const { options, correct } = buildNumberOptions(rnd, ans, optionCount);
  return { kind: "math", text, options, correct };
}

// ── Stroop discipline ─────────────────────────────────────────────────────────────
export function stroopCount(roundIndex: number, cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG): number {
  return cfg.stroopBase + cycle(roundIndex);
}
function buildStroopItem(rnd: () => number, optionCount: number): Pwnit2ChoiceItem {
  const n = PWNIT2_STROOP_COLORS.length;
  const wordColorIndex = Math.floor(rnd() * n);
  // ink differs from the word (that is the interference)
  const inkColorIndex = (wordColorIndex + 1 + Math.floor(rnd() * (n - 1))) % n;
  const want = Math.min(optionCount, n);
  // distractor pool = all colours except the ink, shuffled
  const pool: number[] = [];
  for (let i = 0; i < n; i++) if (i !== inkColorIndex) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
  }
  const options = [inkColorIndex, ...pool.slice(0, want - 1)];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = options[i];
    options[i] = options[j];
    options[j] = t;
  }
  return { kind: "stroop", wordColorIndex, inkColorIndex, options, correct: options.indexOf(inkColorIndex) };
}

// ── Pattern discipline ("what comes next") ─────────────────────────────────────────
export function patternCount(roundIndex: number, cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG): number {
  return cfg.patternBase + cycle(roundIndex);
}
function buildPatternItem(rnd: () => number, tier: number, shown: number, optionCount: number): Pwnit2ChoiceItem {
  const ruleType = Math.floor(rnd() * 2);
  const sequence: number[] = [];
  let next: number;
  if (ruleType === 0) {
    // constant difference
    const a = Math.floor(rnd() * (5 + tier * 3));
    const d = 1 + Math.floor(rnd() * (3 + tier * 2));
    for (let k = 0; k < shown; k++) sequence.push(a + k * d);
    next = a + shown * d;
  } else {
    // increasing difference: steps s, s+1, s+2, ...
    const a = Math.floor(rnd() * (4 + tier * 2));
    let step = 1 + Math.floor(rnd() * (2 + tier));
    let cur = a;
    sequence.push(cur);
    for (let k = 1; k < shown; k++) {
      cur += step;
      sequence.push(cur);
      step += 1;
    }
    next = cur + step;
  }
  const { options, correct } = buildNumberOptions(rnd, next, optionCount);
  return { kind: "pattern", sequence, options, correct };
}

// ── Unified choice-item access (math / stroop / pattern) ───────────────────────────
export function choiceItemsForRound(
  seed: number,
  roundIndex: number,
  cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG,
): Pwnit2ChoiceItem[] {
  const d = disciplineForRound(roundIndex);
  const tier = cycle(roundIndex);
  if (d === "math") {
    return Array.from({ length: mathCount(roundIndex, cfg) }, (_, p) =>
      buildMathItem(rngFor(seed, roundIndex, 3 + p), tier, cfg.mathOptions),
    );
  }
  if (d === "stroop") {
    return Array.from({ length: stroopCount(roundIndex, cfg) }, (_, p) =>
      buildStroopItem(rngFor(seed, roundIndex, 40 + p), cfg.stroopOptions),
    );
  }
  if (d === "pattern") {
    return Array.from({ length: patternCount(roundIndex, cfg) }, (_, p) =>
      buildPatternItem(rngFor(seed, roundIndex, 80 + p), tier, cfg.patternShown, cfg.patternOptions),
    );
  }
  return [];
}
// Back-compat: old name returned the maths items.
export function mathProblems(
  seed: number,
  roundIndex: number,
  cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG,
): Pwnit2ChoiceItem[] {
  return choiceItemsForRound(seed, roundIndex, cfg);
}

// ── Per-round solution + timing ─────────────────────────────────────────────────────
export function roundSolution(
  seed: number,
  roundIndex: number,
  cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG,
): number[] {
  const d = disciplineForRound(roundIndex);
  if (d === "memory") return memorySequence(seed, roundIndex, cfg);
  if (d === "search") return searchTargets(seed, roundIndex, cfg);
  return choiceItemsForRound(seed, roundIndex, cfg).map((it) => it.correct);
}

export function inputTimeMsForRound(roundIndex: number, cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG): number {
  const d = disciplineForRound(roundIndex);
  if (d === "memory") {
    return Math.max(cfg.memInputMinMs, cfg.memInputBaseMs + cfg.memInputPerSymbolMs * memoryLength(roundIndex, cfg));
  }
  if (d === "search") {
    return Math.max(cfg.searchInputMinMs, cfg.searchInputBaseMs + cfg.searchInputPerTargetMs * searchCount(roundIndex, cfg));
  }
  if (d === "math") {
    return Math.max(cfg.mathInputMinMs, cfg.mathInputBaseMs + cfg.mathInputPerProblemMs * mathCount(roundIndex, cfg));
  }
  if (d === "stroop") {
    return Math.max(cfg.stroopInputMinMs, cfg.stroopInputBaseMs + cfg.stroopInputPerItemMs * stroopCount(roundIndex, cfg));
  }
  return Math.max(cfg.patternInputMinMs, cfg.patternInputBaseMs + cfg.patternInputPerItemMs * patternCount(roundIndex, cfg));
}

// ── Validation ──────────────────────────────────────────────────────────────────────
export function validateGauntletRun(
  seed: number,
  rounds: Array<Array<number | null | undefined>>,
  cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG,
): { roundsCleared: number } {
  let cleared = 0;
  const max = Math.min(Array.isArray(rounds) ? rounds.length : 0, cfg.maxRounds);
  for (let i = 0; i < max; i++) {
    const sol = roundSolution(seed, i, cfg);
    const taps = rounds[i];
    if (!Array.isArray(taps) || taps.length !== sol.length) break;
    let ok = true;
    for (let j = 0; j < sol.length; j++) {
      if (Number(taps[j]) !== sol[j]) {
        ok = false;
        break;
      }
    }
    if (!ok) break;
    cleared += 1;
  }
  return { roundsCleared: cleared };
}

// Higher-is-better: depth dominates; time only breaks ties between equal depths.
export function scoreFromRun(roundsCleared: number, elapsedMs: number): number {
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const tieBreak = Math.max(0, 999 - seconds);
  return Math.max(0, Math.min(999999, roundsCleared * 1000 + tieBreak));
}
