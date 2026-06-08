// Deterministic MEMORY-SEQUENCE generator for PwnIt 2, shared by client + server.
// PURE — no Node-only imports — so both sides derive the same sequence from one seed.
// The server re-derives the sequence and checks the player's taps; it never trusts a
// client-claimed score. A "round" shows a growing sequence of coloured pads; the player
// taps them back in order. One wrong tap ends the run. Difficulty = sequence length
// (memory), not speed — the timer is a generous budget and only breaks ties.

export type Pwnit2PuzzleConfig = {
  base: number; // sequence length at round 0
  maxRounds: number; // hard cap
  symbols: number; // number of distinct pads
  flashMs: number; // how long each pad lights up when showing
  gapMs: number; // gap between flashes
  inputBaseMs: number; // input budget = inputBaseMs + inputPerSymbolMs*length (floored)
  inputPerSymbolMs: number;
  inputMinMs: number;
};

export const PWNIT2_PUZZLE_CONFIG: Pwnit2PuzzleConfig = {
  base: 3,
  maxRounds: 50,
  symbols: 4,
  flashMs: 560,
  gapMs: 240,
  inputBaseMs: 3000,
  inputPerSymbolMs: 1100,
  inputMinMs: 6000,
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

// Pad at position k — independent of total length (prefix-stable) and deterministic.
function symbolAt(seed: number, k: number, symbols: number): number {
  const s = (Math.imul((seed ^ 0x9e3779b9) >>> 0, 0x85ebca6b) ^ Math.imul(k + 1, 0xc2b2ae35)) >>> 0;
  return Math.floor(mulberry32(s)() * symbols);
}

export function sequenceLengthForRound(roundIndex: number, cfg: Pwnit2PuzzleConfig = PWNIT2_PUZZLE_CONFIG): number {
  return cfg.base + Math.max(0, roundIndex);
}

export function generateSequence(
  seed: number,
  length: number,
  cfg: Pwnit2PuzzleConfig = PWNIT2_PUZZLE_CONFIG,
): number[] {
  const n = Math.max(0, Math.min(length, cfg.base + cfg.maxRounds));
  return Array.from({ length: n }, (_, k) => symbolAt(seed, k, cfg.symbols));
}

export function sequenceForRound(
  seed: number,
  roundIndex: number,
  cfg: Pwnit2PuzzleConfig = PWNIT2_PUZZLE_CONFIG,
): number[] {
  return generateSequence(seed, sequenceLengthForRound(roundIndex, cfg), cfg);
}

export function inputTimeMsForRound(roundIndex: number, cfg: Pwnit2PuzzleConfig = PWNIT2_PUZZLE_CONFIG): number {
  const len = sequenceLengthForRound(roundIndex, cfg);
  return Math.max(cfg.inputMinMs, cfg.inputBaseMs + cfg.inputPerSymbolMs * len);
}

// taps = the player's longest correct-prefix tap array (the client submits the best run it
// actually produced). roundsCleared is derived from how many leading taps match the sequence.
export function validateRun(
  seed: number,
  taps: Array<number | null | undefined>,
  cfg: Pwnit2PuzzleConfig = PWNIT2_PUZZLE_CONFIG,
): { roundsCleared: number; correctPrefix: number } {
  let p = 0;
  const max = cfg.base + cfg.maxRounds;
  while (p < taps.length && p < max) {
    const t = taps[p];
    if (t === null || t === undefined) break;
    if (Number(t) !== symbolAt(seed, p, cfg.symbols)) break;
    p++;
  }
  const cleared = p < cfg.base ? 0 : Math.min(cfg.maxRounds, p - cfg.base + 1);
  return { roundsCleared: cleared, correctPrefix: p };
}

// Higher-is-better composite: depth dominates; time only breaks ties between equal depths.
export function scoreFromRun(roundsCleared: number, elapsedMs: number): number {
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const tieBreak = Math.max(0, 999 - seconds);
  return Math.max(0, Math.min(999999, roundsCleared * 1000 + tieBreak));
}
