export type Pwnit2LeaderboardEntry = {
  rank: number;
  alias: string;
  score: number;
  bestTime: string;
  attempts: number;
  badge: string;
};

export const pwnit2DemoCampaign = {
  title: "Checkers Voucher",
  category: "Live campaign",
  statusLabel: "Funding",
  statusTone: "funding" as const,
  baseValueLabel: "R500",
  currentValueLabel: "R500",
  activationPct: 60,
  activationPoints: 60,
  activationTargetPoints: 100,
  participants: 18,
  countdownLabel: "Unlocks after activation",
  gameTitle: "Number Chain Sprint",
  gameHref: "/play/pwnit-2",
  leaderboardHref: "/pwnit-2/leaderboard",
  helper:
    "The voucher value stays fixed before activation. Play the linked skill challenge to climb the campaign board and help unlock the countdown.",
  primaryMetricLabel: "Activation",
  primaryMetricValue: "60%",
  secondaryMetricLabel: "Participants",
  secondaryMetricValue: "18",
  tertiaryMetricLabel: "Game",
  tertiaryMetricValue: "Number Chain",
};

export const pwnit2Leaderboard: Pwnit2LeaderboardEntry[] = [
  { rank: 1, alias: "PixelPanda", score: 920, bestTime: "00:31", attempts: 5, badge: "Chain boss" },
  { rank: 2, alias: "QuickQuokka", score: 870, bestTime: "00:34", attempts: 4, badge: "Fast finisher" },
  { rank: 3, alias: "SageFox", score: 810, bestTime: "00:37", attempts: 3, badge: "Clean run" },
  { rank: 4, alias: "CapeCoder", score: 760, bestTime: "00:42", attempts: 3, badge: "Climber" },
  { rank: 5, alias: "NumberNinja", score: 720, bestTime: "00:45", attempts: 2, badge: "Rising" },
];

export const pwnit2HowItWorks = [
  {
    title: "Start with one campaign",
    body: "PwnIt 2 begins with one voucher so the activation, game and leaderboard flow stays easy to follow.",
  },
  {
    title: "Play the linked skill game",
    body: "The campaign links directly to one challenge. Your result is based on speed and accuracy.",
  },
  {
    title: "Climb the board",
    body: "Scores feed the leaderboard experience. The board becomes more important once the countdown unlocks.",
  },
  {
    title: "Countdown after activation",
    body: "The voucher value stays fixed before activation. After activation, the final sprint can begin.",
  },
];
