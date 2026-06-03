export const PWNIT_2_LIFECYCLE_VERSION = "safe-foundation-v1" as const;

export const PWNIT_2_STATUSES = ["FUNDING", "COUNTDOWN", "CLOSED", "ARCHIVED"] as const;

export type Pwnit2Status = (typeof PWNIT_2_STATUSES)[number];

export type Pwnit2EngagementSource =
  | "SKILL_ATTEMPT"
  | "UNIQUE_PARTICIPANT"
  | "VERIFIED_REFERRAL"
  | "SURVEY_RESPONSE"
  | "ADMIN_ADJUSTMENT";

export type Pwnit2EngagementEvent = {
  source: Pwnit2EngagementSource;
  points: number;
};

export type Pwnit2LifecycleInput = {
  status: Pwnit2Status;
  activationTargetPoints: number;
  engagementEvents?: Pwnit2EngagementEvent[];
  activatedAt?: Date | string | null;
  closesAt?: Date | string | null;
  purchaseWindowEndsAt?: Date | string | null;
  now?: Date | string;
};

export type Pwnit2LifecycleState = {
  status: Pwnit2Status;
  activationPoints: number;
  activationTargetPoints: number;
  activationPct: number;
  isActivated: boolean;
  canPlay: boolean;
  canClose: boolean;
  canArchive: boolean;
  message: string;
};

export function normalisePwnit2Status(status: string | null | undefined): Pwnit2Status {
  if (status === "COUNTDOWN" || status === "CLOSED" || status === "ARCHIVED") return status;
  return "FUNDING";
}

export function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function sumEngagementPoints(events: Pwnit2EngagementEvent[] = []): number {
  return events.reduce((total, event) => total + Math.max(0, Math.floor(event.points || 0)), 0);
}

export function getActivationPct(points: number, target: number): number {
  if (target <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((points / target) * 100)));
}

export function shouldActivate(input: Pick<Pwnit2LifecycleInput, "activationTargetPoints" | "engagementEvents">): boolean {
  return sumEngagementPoints(input.engagementEvents) >= Math.max(0, input.activationTargetPoints);
}

export function getPwnit2LifecycleState(input: Pwnit2LifecycleInput): Pwnit2LifecycleState {
  const now = toDate(input.now) ?? new Date();
  const status = normalisePwnit2Status(input.status);
  const activationPoints = sumEngagementPoints(input.engagementEvents);
  const activationTargetPoints = Math.max(0, Math.floor(input.activationTargetPoints || 0));
  const activationPct = getActivationPct(activationPoints, activationTargetPoints);
  const closesAt = toDate(input.closesAt);
  const purchaseWindowEndsAt = toDate(input.purchaseWindowEndsAt);

  const isActivated = status !== "FUNDING" || shouldActivate(input);
  const canPlay = status === "FUNDING" || status === "COUNTDOWN";
  const canClose = status === "COUNTDOWN" && Boolean(closesAt && closesAt.getTime() <= now.getTime());
  const canArchive = status === "CLOSED" && Boolean(purchaseWindowEndsAt && purchaseWindowEndsAt.getTime() <= now.getTime());

  let message = "Campaign is collecting verified engagement before activation.";
  if (status === "COUNTDOWN") message = "Campaign is active and the countdown is running.";
  if (status === "CLOSED") message = "Campaign is closed; final recognition is frozen.";
  if (status === "ARCHIVED") message = "Campaign is archived.";

  return {
    status,
    activationPoints,
    activationTargetPoints,
    activationPct,
    isActivated,
    canPlay,
    canClose,
    canArchive,
    message,
  };
}

export const PWNIT_2_SAFE_LIFECYCLE_COPY = {
  fundingTitle: "Funding / activation",
  fundingBody: "Before activation, the campaign collects verified engagement. No value growth happens before activation.",
  countdownTitle: "Countdown",
  countdownBody: "After activation, the countdown runs and players can continue free skill attempts for leaderboard position.",
  closedTitle: "Closed",
  closedBody: "When the countdown ends, the leaderboard freezes and the top player receives recognition.",
  archivedTitle: "Archived",
  archivedBody: "After the review window, the campaign is archived and a new campaign can start.",
} as const;
