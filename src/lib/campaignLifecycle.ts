// Canonical campaign (ItemRound) lifecycle for PwnIt 2.
// Pure module (no imports) — shared by server guards and the admin tools, and unit-testable.
//
// Stored round states (ItemRound.state):
//   DRAFT      admin-only, not visible/playable          (requested: DRAFT)
//   BUILDING   funding toward activation                 (requested: WAITING_FOR_ACTIVATION)
//   ACTIVATED  countdown live, play allowed              (requested: ACTIVE)
//   CLOSED     attempts frozen, winner locked            (requested: CLOSED)
//   REVIEW     finalists under fair-play review          (part of the purchase window)
//   PUBLISHED  winners announced; buy window runs        (requested: PURCHASE_WINDOW)
//   EXPIRED    discounts expired via ledger              (requested: EXPIRED)
//   ARCHIVED   frozen + hidden; snapshot exists          (requested: ARCHIVED)
//   CANCELLED  admin-cancelled with reason + refunds     (requested: CANCELLED)
//   FAILED / REFUNDED  legacy: activation missed -> consolation + refunds
//
// The public UI maps these to FUNDING / COUNTDOWN / STATUS_WINDOW / ARCHIVED labels.

export const CAMPAIGN_STATES = [
  "DRAFT",
  "BUILDING",
  "ACTIVATED",
  "CLOSED",
  "REVIEW",
  "PUBLISHED",
  "EXPIRED",
  "ARCHIVED",
  "CANCELLED",
  "FAILED",
  "REFUNDED",
] as const;

export type CampaignState = (typeof CAMPAIGN_STATES)[number];

export function isKnownState(state: string): state is CampaignState {
  return (CAMPAIGN_STATES as readonly string[]).includes(state);
}

/** New attempts are allowed only while funding or during the live countdown. */
export function canPlayState(state: string): boolean {
  return state === "BUILDING" || state === "ACTIVATED";
}

/**
 * Buying the voucher outright is allowed throughout a campaign's normal life
 * (funding, countdown, close, review, published) — but never in DRAFT and never
 * after EXPIRED / ARCHIVED / CANCELLED / FAILED / REFUNDED.
 */
export function canBuyState(state: string): boolean {
  return (
    state === "BUILDING" ||
    state === "ACTIVATED" ||
    state === "CLOSED" ||
    state === "REVIEW" ||
    state === "PUBLISHED"
  );
}

/** Discount redemption happens inside a purchase, so it shares the purchase gate. */
export function canRedeemDiscountState(state: string): boolean {
  return canBuyState(state);
}

/** End states: no play, no purchases, no redemption. */
export function isEndState(state: string): boolean {
  return (
    state === "EXPIRED" ||
    state === "ARCHIVED" ||
    state === "CANCELLED" ||
    state === "FAILED" ||
    state === "REFUNDED"
  );
}

export function isTerminalState(state: string): boolean {
  return state === "ARCHIVED";
}

/** States an admin may archive from (snapshot + freeze). */
export const ARCHIVABLE_STATES: readonly CampaignState[] = [
  "CLOSED",
  "PUBLISHED",
  "EXPIRED",
  "CANCELLED",
  "FAILED",
  "REFUNDED",
];

/** States an admin may cancel from (with a required reason + ledger-backed refunds). */
export const CANCELLABLE_STATES: readonly CampaignState[] = [
  "DRAFT",
  "BUILDING",
  "ACTIVATED",
  "CLOSED",
  "REVIEW",
];

/** Admin state machine: which target states each state may move to. */
export const ALLOWED_TRANSITIONS: Record<CampaignState, readonly CampaignState[]> = {
  DRAFT: ["BUILDING", "CANCELLED"],
  BUILDING: ["ACTIVATED", "FAILED", "CANCELLED"],
  ACTIVATED: ["CLOSED", "CANCELLED"],
  CLOSED: ["REVIEW", "PUBLISHED", "EXPIRED", "ARCHIVED", "CANCELLED"],
  REVIEW: ["PUBLISHED", "EXPIRED", "CANCELLED"],
  PUBLISHED: ["EXPIRED", "ARCHIVED"],
  EXPIRED: ["ARCHIVED"],
  CANCELLED: ["ARCHIVED"],
  FAILED: ["REFUNDED", "ARCHIVED"],
  REFUNDED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canTransition(from: string, to: string): boolean {
  if (!isKnownState(from) || !isKnownState(to)) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: string, to: string): void {
  if (!canTransition(from, to)) {
    throw new Error(`invalid_transition:${from}->${to}`);
  }
}
