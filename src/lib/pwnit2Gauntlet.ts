// Deterministic THREE-DISCIPLINE GAUNTLET engine for PwnIt 2, shared by client + server.
// PURE — no Node-only imports — so both sides derive identical rounds from one seed.
//
// Rounds cycle by index (% 3):
//   index % 3 === 0 -> "memory"  (watch a growing colour-pad sequence, tap it back)
//   index % 3 === 1 -> "search"  (Schulte: tap the numbers 1..K in order on a grid)
//   index % 3 === 2 -> "math"    (tap the correct answer to a short chain of problems)
//
// Each round is independent and validated on its own: to clear round i the player must
// submit the exact correct inputs for it (pad indices / cell indices / chosen option
// indices). roundsCleared = the number of LEADING rounds fully cleared. The server
// re-derives every round and never trusts a client score. Difficulty rises once per full
// cycle (every 3 rounds); time is only a tie-breaker.

export type Discipline = "memory" | "search" | "math";

export type Pwnit2MathProblem = { text: string; options: number[]; correct: number };

export type Pwnit2GauntletConfig = {
  maxRounds: number;
  // memory discipline
  memBase: number;
  memSymbols: number;
  memFlashMs: number;
  memGapMs: number;
  memInputBaseMs: number;
  memInputPerSymbolMs: number;
  memInputMinMs: number;
  // search discipline (Schulte grid)
  searchBase: number;
  gridCols: number;
  gridRows: number;
  searchInputBaseMs: number;
  searchInputPerTargetMs: number;
  searchInputMinMs: number;
  // math discipline
  mathBase: number;
  mathOptions: number;
  mathInputBaseMs: number;
  mathInputPerProblemMs: number;
  mathInputMinMs: number;
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
  const m = Math.max(0, roundIndex) % 3;
  return m === 0 ? "memory" : m === 1 ? "search" : "math";
}

// How many full cycles have completed by this round — drives difficulty growth.
function cycle(roundIndex: number): number {
  return Math.floor(Math.max(0, roundIndex) / 3);
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

// ── Search discipline (tap 1..K in order on a grid) ─────────────────────────────
export function searchCount(roundIndex: number, cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG): number {
  const cells = cfg.gridCols * cfg.gridRows;
  return Math.min(cells, cfg.searchBase + cycle(roundIndex));
}

// Returns ordered cell indices: result[0] holds number 1, result[1] holds number 2, ...
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

// ── Math discipline (tap the correct answer) ────────────────────────────────────
export function mathCount(roundIndex: number, cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG): number {
  return cfg.mathBase + cycle(roundIndex);
}

function buildProblem(rnd: () => number, tier: number, optionCount: number): Pwnit2MathProblem {
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

  // distinct, non-negative options including the answer
  const opts: number[] = [ans];
  const deltas = [1, -1, 2, -2, 3, -3, 5, -5, 4, -4, 10, -10];
  let di = 0;
  while (opts.length < optionCount && di < deltas.length * 4) {
    const base = deltas[di % deltas.length];
    const jitter = di >= deltas.length ? Math.floor(rnd() * 5) - 2 : 0;
    const cand = ans + base + jitter;
    if (cand >= 0 && !opts.includes(cand)) opts.push(cand);
    di += 1;
  }
  let pad = 11;
  while (opts.length < optionCount) {
    const cand = ans + pad;
    if (!opts.includes(cand)) opts.push(cand);
    pad += 1;
  }
  // deterministic shuffle
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = opts[i];
    opts[i] = opts[j];
    opts[j] = t;
  }
  return { text, options: opts, correct: opts.indexOf(ans) };
}

export function mathProblems(
  seed: number,
  roundIndex: number,
  cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG,
): Pwnit2MathProblem[] {
  const count = mathCount(roundIndex, cfg);
  const tier = cycle(roundIndex);
  return Array.from({ length: count }, (_, p) => buildProblem(rngFor(seed, roundIndex, 3 + p), tier, cfg.mathOptions));
}

// ── Per-round solution + timing ─────────────────────────────────────────────────
export function roundSolution(
  seed: number,
  roundIndex: number,
  cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG,
): number[] {
  const d = disciplineForRound(roundIndex);
  if (d === "memory") return memorySequence(seed, roundIndex, cfg);
  if (d === "search") return searchTargets(seed, roundIndex, cfg);
  return mathProblems(seed, roundIndex, cfg).map((p) => p.correct);
}

export function inputTimeMsForRound(roundIndex: number, cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG): number {
  const d = disciplineForRound(roundIndex);
  if (d === "memory") {
    const len = memoryLength(roundIndex, cfg);
    return Math.max(cfg.memInputMinMs, cfg.memInputBaseMs + cfg.memInputPerSymbolMs * len);
  }
  if (d === "search") {
    const k = searchCount(roundIndex, cfg);
    return Math.max(cfg.searchInputMinMs, cfg.searchInputBaseMs + cfg.searchInputPerTargetMs * k);
  }
  const m = mathCount(roundIndex, cfg);
  return Math.max(cfg.mathInputMinMs, cfg.mathInputBaseMs + cfg.mathInputPerProblemMs * m);
}

// ── Validation ──────────────────────────────────────────────────────────────────
// rounds[i] = the player's taps for round i. A round is cleared only if its taps exactly
// equal that round's solution. roundsCleared = number of leading rounds fully cleared.
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
