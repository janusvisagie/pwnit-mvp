
export type SupportedGameKey =
  | "tap-speed"
  | "target-hold"
  | "number-memory"
  | "flash-count"
  | "memory-sprint"
  | "alphabet-sprint"
  | "quick-stop"
  | "moving-zone"
  | "trace-run"
  | "target-grid"
  | "route-builder"
  | "codebreaker"
  | "hidden-pair-memory"
  | "rule-lock"
  | "transform-memory"
  | "sequence-restore"
  | "balance-grid"
  | "pattern-match"
  | "spot-the-missing"
  | "rapid-math-relay"
  | "progressive-mosaic"
  | "clue-ladder"
  | "safe-path-fog"
  | "signal-hunt";

type GameMeta = {
  label: string;
  higherIsBetter: boolean;
  description: string;
  formatScore: (score: number) => string;
};

const DEFAULT_META: GameMeta = {
  label: "Quick Skill Game",
  higherIsBetter: true,
  description: "Post the strongest score to climb the leaderboard.",
  formatScore: (score) => `${Number(score || 0).toLocaleString("en-ZA")} pts`,
};

export const GAME_META: Record<string, GameMeta> = {
  "tap-speed": {
    label: "Tap Rush",
    higherIsBetter: true,
    description: "Tap as many times as possible before the clock runs out.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0)))} taps`,
  },
  "target-hold": {
    label: "Zone Hold",
    higherIsBetter: true,
    description: "Hold inside the target zone and finish with the highest control score.",
    formatScore: (score) => `${Number(score || 0).toLocaleString("en-ZA")} pts`,
  },
  "flash-count": {
    label: "Flash Count",
    higherIsBetter: true,
    description: "Count only the target colour and answer quickly for a stronger score.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "number-memory": {
    label: "Memory Sprint",
    higherIsBetter: true,
    description: "Memorise longer sequences and finish quickly for a stronger score.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "memory-sprint": {
    label: "Memory Sprint",
    higherIsBetter: true,
    description: "Memorise longer sequences and finish quickly for a stronger score.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "alphabet-sprint": {
    label: "Alphabet Sprint",
    higherIsBetter: true,
    description: "Run from A to Z by answering each clue with the correct starting letter before time slips away.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "quick-stop": {
    label: "Quick Stop",
    higherIsBetter: false,
    description: "Stop as close to centre as you can. Lower score wins.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "moving-zone": {
    label: "Moving Zone Hold",
    higherIsBetter: false,
    description: "Track the red centre line inside the moving green band. Less centre-line drift gives a better score.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "trace-run": {
    label: "Alphabet Sprint",
    higherIsBetter: true,
    description: "Run from A to Z by answering each clue with the correct starting letter before time slips away.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "target-grid": {
    label: "Target Grid",
    higherIsBetter: false,
    description: "Hit the target square quickly and cleanly. Lower score wins.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "route-builder": {
    label: "Route Builder",
    higherIsBetter: true,
    description: "Build a longer clean route through the board, clear every checkpoint, and avoid blocked tiles.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  codebreaker: {
    label: "Codebreaker",
    higherIsBetter: true,
    description: "Crack the hidden code through progressive feedback. The server reveals only exact and misplaced hints after each guess.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "hidden-pair-memory": {
    label: "Hidden Pair Memory",
    higherIsBetter: true,
    description: "Flip hidden pairs, learn the board step by step, and clear all matches before you run out of turns.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "rule-lock": {
    label: "Rule Lock",
    higherIsBetter: true,
    description: "Arrange the PwnIt words to satisfy every lock rule at the same time.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "transform-memory": {
    label: "Transform Memory",
    higherIsBetter: true,
    description: "Memorise the shown pattern, transform it according to the rule, then rebuild the transformed version.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "sequence-restore": {
    label: "Sequence Restore",
    higherIsBetter: true,
    description: "Watch the ordered PwnIt strip, then rebuild the same sequence from memory.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "balance-grid": {
    label: "Balance Grid",
    higherIsBetter: true,
    description: "Pick one number from each row and each column to hit the target sum.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "pattern-match": {
    label: "Pattern Match",
    higherIsBetter: true,
    description: "Choose the strip that exactly matches the shown PwnIt pattern.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "spot-the-missing": {
    label: "Spot the Missing",
    higherIsBetter: true,
    description: "Memorise the PwnIt words, then pick the one that disappears.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
  "rapid-math-relay": {
    label: "Rapid Math Relay",
    higherIsBetter: true,
    description: "Solve the relay of quick sums and products before the time window closes.",
    formatScore: (score) => `${Math.max(0, Math.floor(Number(score || 0))).toLocaleString("en-ZA")} pts`,
  },
};

export function getGameMeta(gameKey?: string | null): GameMeta {
  return (gameKey && GAME_META[gameKey]) || DEFAULT_META;
}

export function getGameLabel(gameKey?: string | null) {
  if (!gameKey) return DEFAULT_META.label;
  return getGameMeta(gameKey).label;
}

export function compareScores(
  gameKey: string | null | undefined,
  a: { scoreMs: number; createdAt?: Date | string | null },
  b: { scoreMs: number; createdAt?: Date | string | null },
) {
  const meta = getGameMeta(gameKey);
  const diff = meta.higherIsBetter ? b.scoreMs - a.scoreMs : a.scoreMs - b.scoreMs;
  if (diff !== 0) return diff;
  const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return aTime - bTime;
}

export function getBestScore(
  gameKey: string | null | undefined,
  scores: Array<{ scoreMs: number; createdAt?: Date | string | null }>,
) {
  if (!scores.length) return null;
  return [...scores].sort((a, b) => compareScores(gameKey, a, b))[0];
}

export function publicStageLabel(progressPct: number) {
  if (progressPct >= 100) return "Activated";
  if (progressPct >= 85) return "Almost there";
  if (progressPct >= 60) return "Heating up";
  if (progressPct >= 25) return "Building";
  return "Starting";
}

export function publicProgressPct(current: number, target: number) {
  if (target <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}
