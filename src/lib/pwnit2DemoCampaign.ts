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

// Mirrors the quote returned by /api/pwnit-2/purchase (1 credit == R1).
export type Pwnit2PurchaseQuote = {
  voucherValueZAR: number;
  yourDiscountZAR: number;
  payableZAR: number;
  walletAppliedZAR: number;
  topUpZAR: number;
  canBuy: boolean;
  isWinnerYou: boolean;
  alreadyPurchased: boolean;
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

  // Extended fields supplied by the live API (optional so the demo fallback stays valid).
  baseValueZAR?: number;
  currentValueZAR?: number;
  growthZAR?: number;
  playCostCredits?: number;
  yourDiscountZAR?: number;
  yourPaidPlays?: number;
  yourTotalPlays?: number;
  isWinnerYou?: boolean;
  purchase?: Pwnit2PurchaseQuote | null;
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
  helper:
    "Play the skill game to help unlock the countdown. Paid plays also build your discount on this voucher.",
  primaryMetricLabel: "Activation",
  primaryMetricValue: "0%",
  secondaryMetricLabel: "Players",
  secondaryMetricValue: "0",
  tertiaryMetricLabel: "Voucher",
  tertiaryMetricValue: "R500",
  state: "FUNDING",
  closesAt: null,
  statusWindowEndsAt: null,
  winnerAlias: null,
  topScore: null,

  baseValueZAR: 500,
  currentValueZAR: 500,
  growthZAR: 0,
  playCostCredits: 5,
  yourDiscountZAR: 0,
  yourPaidPlays: 0,
  yourTotalPlays: 0,
  isWinnerYou: false,
  purchase: null,
};

export const pwnit2Leaderboard: Pwnit2LeaderboardEntry[] = [];

export const pwnit2HowItWorks = [
  {
    title: "Play the campaign game",
    body: "Each run of Number Chain Sprint costs a few credits. You get free credits daily, and you can top up any time.",
  },
  {
    title: "Build the voucher — and your discount",
    body: "Paid plays fund the campaign toward activation, and every R1 you spend becomes R1 of discount on this voucher.",
  },
  {
    title: "Activation starts the countdown",
    body: "Once the campaign is funded, the countdown begins and the voucher value starts to grow.",
  },
  {
    title: "Win it, or buy it with your discount",
    body: "When the countdown ends, the top score wins the voucher. Everyone else can buy it during the window, minus the discount they earned.",
  },
];
