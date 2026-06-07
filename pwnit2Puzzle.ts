// Deterministic puzzle generator for PwnIt 2.
// PURE module — no Node-only imports — so the SAME code runs on the client (to
// render rounds) and on the server (to re-derive and validate them). Given the
// same seed, both sides produce identical rounds, which is what lets the server
// recompute "rounds cleared" without trusting the client's claimed score.

export type Pwnit2Round = {
  index: number;
  prompt: string;
  answer: number;
  options: number[];
  timeLimitMs: number;
};

export type Pwnit2PuzzleConfig = {
  maxRounds: number; // hard cap so arrays stay bounded
  baseTimeMs: number; // round-0 thinking budget
  minTimeMs: number; // floor — never twitch-fast
  timeStepMs: number; // reduction per difficulty tier
  tierEvery: number; // rounds per difficulty tier
};

export const PWNIT2_PUZZLE_CONFIG: Pwnit2PuzzleConfig = {
  maxRounds: 200,
  baseTimeMs: 12000,
  minTimeMs: 6000,
  timeStepMs: 600,
  tierEvery: 3,
};

// mulberry32 — tiny deterministic PRNG from a uint32 seed.
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Independent, deterministic RNG per round derived from the master seed + index.
function roundRng(seed: number, index: number) {
  const s = (Math.imul((seed ^ 0x9e3779b9) >>> 0, 0x85ebca6b) ^ Math.imul(index + 1, 0xc2b2ae35)) >>> 0;
  return mulberry32(s);
}

function tierForIndex(index: number, cfg: Pwnit2PuzzleConfig) {
  return Math.floor(index / cfg.tierEvery); // 0,0,0,1,1,1,2,...
}

function timeLimitForIndex(index: number, cfg: Pwnit2PuzzleConfig) {
  const tier = tierForIndex(index, cfg);
  return Math.max(cfg.minTimeMs, cfg.baseTimeMs - tier * cfg.timeStepMs);
}

type Step = { label: string; delta: number; kind: "add" | "sub" | "double" | "triple" };

function applyStep(n: number, s: Step): number {
  switch (s.kind) {
    case "add":
      return n + s.delta;
    case "sub":
      return n - s.delta;
    case "double":
      return n * 2;
    case "triple":
      return n * 3;
  }
}

function buildSteps(rng: () => number, tier: number): Step[] {
  // Op count grows slowly: 2 (easy) -> 3 -> 4. Early rounds stay friendly.
  const opCount = tier <= 1 ? 2 : tier <= 4 ? 3 : 4;
  const mag = 3 + tier * 2; // bigger numbers as difficulty rises
  const steps: Step[] = [];
  for (let i = 0; i < opCount; i++) {
    const r = rng();
    const a = 1 + Math.floor(rng() * mag); // always consume one rng() for the magnitude
    if (r < 0.45) steps.push({ label: `Add ${a}`, delta: a, kind: "add" });
    else if (r < 0.8) steps.push({ label: `Subtract ${a}`, delta: a, kind: "sub" });
    else if (r < 0.92) steps.push({ label: `Double it`, delta: 0, kind: "double" });
    else steps.push({ label: `Triple it`, delta: 0, kind: "triple" });
  }
  return steps;
}

function evaluate(start: number, steps: Step[]): number {
  let v = start;
  for (const s of steps) v = applyStep(v, s);
  return v;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateRound(
  seed: number,
  index: number,
  cfg: Pwnit2PuzzleConfig = PWNIT2_PUZZLE_CONFIG,
): Pwnit2Round {
  const rng = roundRng(seed, index);
  const tier = tierForIndex(index, cfg);
  const start = 5 + Math.floor(rng() * (8 + tier * 3));
  let steps = buildSteps(rng, tier);

  // Keep the answer non-negative for friendliness: if it dips below zero,
  // turn subtractions into additions and recompute (deterministic — no new rng()).
  if (evaluate(start, steps) < 0) {
    steps = steps.map((s) =>
      s.kind === "sub" ? { label: `Add ${s.delta}`, delta: s.delta, kind: "add" as const } : s,
    );
  }
  const answer = evaluate(start, steps);

  const labels = steps.map((s, i) => (i === 0 ? s.label : s.label.charAt(0).toLowerCase() + s.label.slice(1)));
  const prompt = `Start at ${start}. ` + labels.join(", then ") + ".";

  // Plausible near-miss distractors, deterministic.
  const set = new Set<number>([answer]);
  const deltas = [1, -1, 2, -2, 3, -3, 4, 5];
  let guard = 0;
  while (set.size < 4 && guard < 64) {
    const pick = deltas[Math.floor(rng() * deltas.length)];
    const cand = answer + pick + Math.floor(rng() * 2);
    if (cand >= 0) set.add(cand); // Set dedups; never re-adds the answer
    guard++;
  }
  let pad = answer + 6;
  while (set.size < 4) {
    if (pad >= 0) set.add(pad);
    pad++;
  }

  const options = shuffle(Array.from(set), rng);
  return { index, prompt, answer, options, timeLimitMs: timeLimitForIndex(index, cfg) };
}

// answers[i] = the option the player chose for round i, or null/undefined if none.
// roundsCleared = length of the maximal correct prefix (stops at first wrong/missing).
export function validateRun(
  seed: number,
  answers: Array<number | null | undefined>,
  cfg: Pwnit2PuzzleConfig = PWNIT2_PUZZLE_CONFIG,
): { roundsCleared: number } {
  let cleared = 0;
  const n = Math.min(answers.length, cfg.maxRounds);
  for (let i = 0; i < n; i++) {
    const ans = answers[i];
    if (ans === null || ans === undefined) break;
    const round = generateRound(seed, i, cfg);
    if (Number(ans) === round.answer) cleared++;
    else break;
  }
  return { roundsCleared: cleared };
}

// Higher-is-better composite: depth dominates; time is only a tie-break between
// equal depths (max tie-break 999 < the 1000 a single extra round is worth).
export function scoreFromRun(roundsCleared: number, elapsedMs: number): number {
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const tieBreak = Math.max(0, 999 - seconds);
  const raw = roundsCleared * 1000 + tieBreak;
  return Math.max(0, Math.min(999999, raw));
}
