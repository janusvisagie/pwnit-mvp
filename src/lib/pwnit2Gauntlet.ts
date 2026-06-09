// Deterministic TWO-DISCIPLINE GAUNTLET engine for PwnIt 2, shared by client + server.
// PURE — no Node-only imports — so both sides derive identical rounds from one seed.
//
// Rounds alternate by index:
//   even index -> "memory"  (watch a growing colour-pad sequence, tap it back)
//   odd index  -> "search"  (Schulte-style: tap the numbers 1..K in order on a grid)
//
// Each round is independent and validated on its own: to clear round i the player must
// submit the exact correct inputs for that round. roundsCleared = the number of LEADING
// rounds fully cleared (we stop at the first round that is not fully correct). The server
// re-derives every round and never trusts a client score. Difficulty rises with depth;
// time is only a tie-breaker.

export type Discipline = "memory" | "search";

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
};

export const PWNIT2_GAUNTLET_CONFIG: Pwnit2GauntletConfig = {
  maxRounds: 40,
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

// Independent deterministic RNG per (seed, round, salt). Salt separates disciplines.
function rngFor(seed: number, roundIndex: number, salt: number) {
  const s =
    (Math.imul((seed ^ 0x9e3779b9) >>> 0, 0x85ebca6b) ^
      Math.imul(roundIndex * 2 + 1, 0xc2b2ae35) ^
      Math.imul(salt + 1, 0x27d4eb2f)) >>>
    0;
  return mulberry32(s);
}

export function disciplineForRound(roundIndex: number): Discipline {
  return roundIndex % 2 === 0 ? "memory" : "search";
}

// ── Memory discipline ─────────────────────────────────────────────────────────
export function memoryLength(roundIndex: number, cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG): number {
  return cfg.memBase + Math.floor(Math.max(0, roundIndex) / 2);
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
  return Math.min(cells, cfg.searchBase + Math.floor(Math.max(0, roundIndex) / 2));
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

// ── Per-round solution + timing ─────────────────────────────────────────────────
export function roundSolution(
  seed: number,
  roundIndex: number,
  cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG,
): number[] {
  return disciplineForRound(roundIndex) === "memory"
    ? memorySequence(seed, roundIndex, cfg)
    : searchTargets(seed, roundIndex, cfg);
}

export function inputTimeMsForRound(roundIndex: number, cfg: Pwnit2GauntletConfig = PWNIT2_GAUNTLET_CONFIG): number {
  if (disciplineForRound(roundIndex) === "memory") {
    const len = memoryLength(roundIndex, cfg);
    return Math.max(cfg.memInputMinMs, cfg.memInputBaseMs + cfg.memInputPerSymbolMs * len);
  }
  const k = searchCount(roundIndex, cfg);
  return Math.max(cfg.searchInputMinMs, cfg.searchInputBaseMs + cfg.searchInputPerTargetMs * k);
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
