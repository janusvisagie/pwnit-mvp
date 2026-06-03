export type Pwnit2StatusTone = "funding" | "countdown" | "closed";

export type Pwnit2LeaderboardEntry = {
  rank: number;
  alias: string;
  score: number;
  bestTime: string;
  attempts: number;
  badge: string;
  isYou?: boolean;
};

export type Pwnit2CampaignSnapshot = {
  title: string;
  category: string;
  statusLabel: string;
  statusTone: Pwnit2StatusTone;
  baseValueLabel: string;
  currentValueLabel: string;
  activationPct: number;
  activationPoints: number;
  activationTargetPoints: number;
  participants: number;
  attempts: number;
  countdownLabel: string;
  gameTitle: string;
  gameHref: string;
  leaderboardHref: string;
  statusHref: string;
  helper: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  tertiaryMetricLabel?: string;
  tertiaryMetricValue?: string;
  state: "FUNDING" | "COUNTDOWN" | "STATUS_WINDOW" | "ARCHIVED";
  closesAt?: string | null;
  statusWindowEndsAt?: string | null;
  winnerAlias?: string | null;
  topScore?: number | null;
};

export const pwnit2DemoCampaign: Pwnit2CampaignSnapshot = {
  title: "Checkers Voucher",
  category: "Live campaign",
  statusLabel: "Funding",
  statusTone: "funding",
  baseValueLabel: "R500",
  currentValueLabel: "R500",
  activationPct: 0,
  activationPoints: 0,
  activationTargetPoints: 5,
  participants: 0,
  attempts: 0,
  countdownLabel: "Unlocks after activation",
  gameTitle: "Number Chain Sprint",
  gameHref: "/play/pwnit-2",
  leaderboardHref: "/pwnit-2/leaderboard",
  statusHref: "/pwnit-2/status",
  helper: "Play the linked skill game to help the campaign reach activation. The countdown starts once activation is reached.",
  primaryMetricLabel: "Activation",
  primaryMetricValue: "0%",
  secondaryMetricLabel: "Players",
  secondaryMetricValue: "0",
  tertiaryMetricLabel: "Game",
  tertiaryMetricValue: "Number Chain",
  state: "FUNDING",
  closesAt: null,
  statusWindowEndsAt: null,
  winnerAlias: null,
  topScore: null,
};

export const pwnit2Leaderboard: Pwnit2LeaderboardEntry[] = [];

export const pwnit2HowItWorks = [
  {
    title: "Play the campaign game",
    body: "Number Chain Sprint is linked directly to the current Checkers voucher campaign.",
  },
  {
    title: "Build activation",
    body: "Each completed run counts toward activation until the campaign enters its countdown.",
  },
  {
    title: "Climb the board",
    body: "Scores are saved to the campaign leaderboard so you can track your position.",
  },
  {
    title: "Watch the final status",
    body: "When the countdown ends, the board freezes and the final campaign status is shown.",
  },
];
