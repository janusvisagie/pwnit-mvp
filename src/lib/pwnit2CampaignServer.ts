// src/lib/pwnit2CampaignServer.ts
//
// PwnIt 2 single-voucher campaign, wired onto the REAL PwnIt 1 engine
// (rounds.ts + settle.ts + pricing.ts + credits.ts) instead of a shadow lifecycle.
//
// What this gives you, for free, from the existing engine:
//   - Funding-based activation (effectiveActivationCredits >= activationTargetCredits)
//   - Countdown, close, winner settlement, anti-cheat review gating  (settleRound)
//   - Post-closure purchase window  (purchaseGraceEndsAt)
//   - Paid play -> voucher discount, capped at face value  (buyPriceAfterSpend)
//
// What this file adds on top:
//   - Voucher growth after activation  (pwnit2Growth.ts)
//   - A single Checkers campaign Item, configured so plays cost credits
//     (so paid credits accrue as discount, and free daily credits don't)
//   - A user-facing snapshot, leaderboard, discount balance, and purchase quote

import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth";
import { dayKeyZA } from "@/lib/time";
import { flagAttempt, flagsToString } from "@/lib/antiCheat";
import { spendCredits } from "@/lib/credits";
import { resolvePlayCostCredits } from "@/lib/playCost";
import { buyPriceAfterSpend, tierKeyFromTierNumber, discountPctForTierKey } from "@/lib/pricing";
import {
  ensureCurrentRound,
  syncRoundLifecycle,
  activationTargetForItem,
  publicProgress,
} from "@/lib/rounds";
import { computeVoucherValue, pwnit2GrowthConfigFromEnv } from "@/lib/pwnit2Growth";
import type { Pwnit2CampaignSnapshot, Pwnit2LeaderboardEntry } from "@/lib/pwnit2DemoCampaign";

const ITEM_TITLE = "Checkers Voucher";
const GAME_TITLE = "Number Chain Sprint";
const GAME_KEY = "pwnit-2-number-chain";
const BASE_VALUE_ZAR = Number(process.env.PWNIT2_BASE_VALUE_ZAR ?? "500");
const PLAY_COST_CREDITS = Number(process.env.PWNIT2_PLAY_COST_CREDITS ?? "5");
const ACTIVATION_ENTRIES = Number(process.env.PWNIT2_ACTIVATION_PLAYS ?? "5");
const COUNTDOWN_MINUTES = Number(process.env.PWNIT2_COUNTDOWN_MINUTES ?? "30");
const STATUS_WINDOW_HOURS = Number(process.env.PWNIT2_STATUS_WINDOW_HOURS ?? "24");
const SCORE_OFFSET = 1_000_000;

// ── score <-> scoreMs (higher game score => lower scoreMs => better rank) ──────
function scoreToScoreMs(score: number) {
  return Math.max(1, SCORE_OFFSET - Math.max(0, Math.floor(score)));
}
function scoreMsToScore(scoreMs: number) {
  return Math.max(0, SCORE_OFFSET - Math.max(1, Math.floor(scoreMs)));
}

function safeDateIso(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function aliasForUser(
  user: { alias?: string | null; email?: string | null; isGuest?: boolean | null },
  fallback: string,
) {
  if (user?.alias) return user.alias;
  if (!user?.isGuest && user?.email) return user.email.split("@")[0] || fallback;
  return fallback;
}

// ── State mapping: engine round.state -> PwnIt 2 public state ─────────────────
function publicState(state: string): Pwnit2CampaignSnapshot["state"] {
  if (state === "ACTIVATED") return "COUNTDOWN";
  if (state === "CLOSED" || state === "REVIEW" || state === "PUBLISHED") return "STATUS_WINDOW";
  if (state === "ARCHIVED" || state === "FAILED" || state === "REFUNDED") return "ARCHIVED";
  return "FUNDING";
}
function isActivatedState(state: string) {
  return ["ACTIVATED", "CLOSED", "REVIEW", "PUBLISHED"].includes(state);
}
function statusLabel(state: string) {
  if (state === "ACTIVATED") return "Countdown";
  if (state === "CLOSED" || state === "REVIEW") return "Final status";
  if (state === "PUBLISHED") return "Winner announced";
  if (state === "ARCHIVED" || state === "FAILED" || state === "REFUNDED") return "Archived";
  return "Funding";
}
function statusTone(state: string): Pwnit2CampaignSnapshot["statusTone"] {
  if (state === "ACTIVATED") return "countdown";
  if (state === "FUNDING" || state === "BUILDING") return "funding";
  return "closed";
}

// ── Extended snapshot (superset of the base type; extra fields pass through) ──
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

export type Pwnit2SnapshotEx = Pwnit2CampaignSnapshot & {
  baseValueZAR: number;
  currentValueZAR: number;
  growthZAR: number;
  playCostCredits: number;
  yourDiscountZAR: number;
  yourPaidPlays: number;
  yourTotalPlays: number;
  isWinnerYou: boolean;
  purchase: Pwnit2PurchaseQuote | null;
};

// ── Ensure the single campaign Item exists and is correctly configured ────────
async function ensurePwnit2Item() {
  const existing = await prisma.item.findFirst({
    where: { title: ITEM_TITLE },
    orderBy: { createdAt: "asc" },
  });

  const config = {
    prizeType: "VOUCHER",
    prizeValueZAR: BASE_VALUE_ZAR, // base value; growth is computed, not stored here
    landedCostZAR: BASE_VALUE_ZAR,
    playCostCredits: PLAY_COST_CREDITS, // > 0 so paid credits accrue as discount
    purchaseGraceHours: STATUS_WINDOW_HOURS,
    activationGoalEntries: ACTIVATION_ENTRIES,
    countdownMinutes: COUNTDOWN_MINUTES,
    gameKey: GAME_KEY,
    isHero: true,
    shortDesc: "PwnIt 2 single-voucher campaign",
  };

  if (existing) {
    // Reconcile config in case a patch-9 item was created with playCostCredits: 0
    return prisma.item.update({ where: { id: existing.id }, data: config as any });
  }

  return prisma.item.create({
    data: { title: ITEM_TITLE, tier: 1, sortOrder: 1, state: "OPEN", fundingWindowHours: 168, ...config } as any,
  });
}

// ── Reconcile the active round's funding target if it was set as a play count ─
async function reconcileRoundTarget(item: any, round: any) {
  if (!round || round.state !== "BUILDING") return round;
  const target = activationTargetForItem(item);
  if (Number(round.activationTargetCredits) !== target) {
    return prisma.itemRound.update({
      where: { id: round.id },
      data: { activationTargetCredits: target },
    });
  }
  return round;
}

async function getContext() {
  const item = await ensurePwnit2Item();
  await syncRoundLifecycle(item.id); // engine owns the lifecycle transitions
  let round = await ensureCurrentRound(item.id);
  round = await reconcileRoundTarget(item, round);
  return { item, round: round! };
}

// ── Leaderboard: best scoreMs per user in the current round ───────────────────
async function getLeaderboard(
  itemId: string,
  roundId: string,
  currentUserId?: string | null,
): Promise<Pwnit2LeaderboardEntry[]> {
  const rows = await prisma.attempt.findMany({
    where: { itemId, roundId },
    orderBy: [{ scoreMs: "asc" }, { createdAt: "asc" }],
    select: {
      userId: true,
      scoreMs: true,
      createdAt: true,
      user: { select: { alias: true, email: true, isGuest: true } },
    },
  });

  const bestByUser = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const current = bestByUser.get(row.userId);
    if (!current || Number(row.scoreMs) < Number(current.scoreMs)) bestByUser.set(row.userId, row);
  }

  return Array.from(bestByUser.values())
    .sort(
      (a, b) =>
        Number(a.scoreMs) - Number(b.scoreMs) ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((row, index) => ({
      rank: index + 1,
      alias: aliasForUser(row.user, `Player ${index + 1}`),
      score: scoreMsToScore(Number(row.scoreMs)),
      bestTime: new Date(row.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attempts: rows.filter((r) => r.userId === row.userId).length,
      badge: index === 0 ? "Top run" : index < 3 ? "Podium" : "Climber",
      isYou: Boolean(currentUserId && row.userId === currentUserId),
    }));
}

// ── Your earned campaign discount = sum of paid credits across your attempts ──
async function getUserPaidUsed(itemId: string, roundId: string, userId: string) {
  const agg = await prisma.attempt.aggregate({
    where: { itemId, roundId, userId },
    _sum: { paidUsed: true },
  });
  return Math.max(0, Number(agg._sum.paidUsed ?? 0));
}

async function getUserPlayCounts(itemId: string, roundId: string, userId: string) {
  const [total, paid] = await Promise.all([
    prisma.attempt.count({ where: { itemId, roundId, userId } }),
    prisma.attempt.count({ where: { itemId, roundId, userId, isPaid: true } }),
  ]);
  return { total, paid };
}

// ── Build a purchase quote for the current user ───────────────────────────────
async function buildPurchaseQuote(params: {
  item: any;
  round: any;
  userId: string;
  currentValueZAR: number;
}): Promise<Pwnit2PurchaseQuote> {
  const { item, round, userId, currentValueZAR } = params;

  const won = await prisma.winner.findFirst({
    where: { roundId: round.id, userId, rank: 1, rewardType: "ITEM" },
  });
  const alreadyPurchased = await prisma.itemPurchase.findFirst({
    where: { itemId: item.id, roundId: round.id, userId },
  });

  const yourPaidUsed = await getUserPaidUsed(item.id, round.id, userId);
  const wallet = await prisma.user.findUnique({
    where: { id: userId },
    select: { paidCreditsBalance: true },
  });

  const price = buyPriceAfterSpend({
    prizeValueZAR: currentValueZAR, // grown voucher value
    tierNumber: item.tier,
    spentCredits: yourPaidUsed,
    walletCredits: Number(wallet?.paidCreditsBalance ?? 0),
  });

  // Purchasing is allowed during countdown and the post-closure window, never after archive.
  const buyableState = ["ACTIVATED", "CLOSED", "PUBLISHED"].includes(round.state);

  return {
    voucherValueZAR: currentValueZAR,
    yourDiscountZAR: price.playDiscountCredits, // 1 credit == R1
    payableZAR: price.newPriceCredits,
    walletAppliedZAR: price.walletAppliedCredits,
    topUpZAR: price.topUpCredits,
    canBuy: buyableState && !won && !alreadyPurchased,
    isWinnerYou: Boolean(won),
    alreadyPurchased: Boolean(alreadyPurchased),
  };
}

// ── Public snapshot ───────────────────────────────────────────────────────────
export async function getPwnit2CampaignSnapshot(options: { includeActor?: boolean } = {}) {
  const actor = options.includeActor ? await getCurrentActor() : null;
  const { item, round } = await getContext();
  const userId = actor?.user?.id ?? null;

  const leaderboard = await getLeaderboard(item.id, round.id, userId);
  const progress = publicProgress(round);
  const activated = isActivatedState(round.state);

  const growth = computeVoucherValue(
    pwnit2GrowthConfigFromEnv({
      baseValueZAR: BASE_VALUE_ZAR,
      paidCollectedZAR: Number(round.paidCreditsCollected ?? 0), // 1 credit == R1
      activated,
    }),
  );

  const top = leaderboard[0] ?? null;

  // Winner (after settlement) or provisional top when closed
  const winnerRow = await prisma.winner.findFirst({
    where: { roundId: round.id, rank: 1 },
    select: { userId: true, alias: true },
  });
  const isWinnerYou = Boolean(userId && winnerRow?.userId === userId);

  const yourPaidUsed = userId ? await getUserPaidUsed(item.id, round.id, userId) : 0;
  const counts = userId ? await getUserPlayCounts(item.id, round.id, userId) : { total: 0, paid: 0 };
  const purchase = userId
    ? await buildPurchaseQuote({ item, round, userId, currentValueZAR: growth.currentValueZAR })
    : null;

  const state = publicState(round.state);
  const helper =
    state === "FUNDING"
      ? "Play the skill game to help unlock the countdown. Paid plays also build your discount on this voucher."
      : state === "COUNTDOWN"
        ? "The countdown is live. Keep playing to climb the leaderboard and watch the voucher grow."
        : state === "STATUS_WINDOW"
          ? "The leaderboard is frozen. Use your campaign discount to buy this voucher before the window closes."
          : "This campaign is archived.";

  const snapshot: Pwnit2SnapshotEx = {
    title: ITEM_TITLE,
    category: "Live campaign",
    statusLabel: statusLabel(round.state),
    statusTone: statusTone(round.state),
    baseValueLabel: `R${BASE_VALUE_ZAR}`,
    currentValueLabel: `R${growth.currentValueZAR}`,
    activationPct: progress.pct,
    activationPoints: progress.current,
    activationTargetPoints: progress.target,
    participants: leaderboard.length,
    attempts: Number(round.attemptCount ?? 0),
    countdownLabel:
      state === "FUNDING"
        ? "Unlocks after activation"
        : state === "COUNTDOWN" && round.closesAt
          ? `Ends ${new Date(round.closesAt).toLocaleString()}`
          : state === "STATUS_WINDOW" && round.purchaseGraceEndsAt
            ? `Buy window until ${new Date(round.purchaseGraceEndsAt).toLocaleString()}`
            : "Campaign archived",
    gameTitle: GAME_TITLE,
    gameHref: "/play/pwnit-2",
    leaderboardHref: "/pwnit-2/leaderboard",
    statusHref: "/pwnit-2/status",
    helper,
    primaryMetricLabel: state === "FUNDING" ? "Activation" : "Voucher",
    primaryMetricValue: state === "FUNDING" ? `${progress.pct}%` : `R${growth.currentValueZAR}`,
    secondaryMetricLabel: "Players",
    secondaryMetricValue: String(leaderboard.length),
    tertiaryMetricLabel: "Top score",
    tertiaryMetricValue: top ? String(top.score) : "—",
    state,
    closesAt: safeDateIso(round.closesAt),
    statusWindowEndsAt: safeDateIso(round.purchaseGraceEndsAt),
    winnerAlias: state === "STATUS_WINDOW" || state === "ARCHIVED" ? winnerRow?.alias ?? top?.alias ?? null : null,
    topScore: top?.score ?? null,

    // extended fields
    baseValueZAR: BASE_VALUE_ZAR,
    currentValueZAR: growth.currentValueZAR,
    growthZAR: growth.growthZAR,
    playCostCredits: resolvePlayCostCredits(item),
    yourDiscountZAR: yourPaidUsed,
    yourPaidPlays: counts.paid,
    yourTotalPlays: counts.total,
    isWinnerYou,
    purchase,
  };

  return { item, round, snapshot, leaderboard, actor };
}

// ── Record a play (charges credits, accrues discount, feeds funding) ──────────
export async function submitPwnit2Score(input: {
  score: number;
  elapsedSeconds: number;
  correct: number;
  total: number;
  rttMs?: number;
}) {
  const actor = await getCurrentActor();
  const { item, round } = await getContext();

  if (!["BUILDING", "ACTIVATED"].includes(String(round.state))) {
    const current = await getPwnit2CampaignSnapshot({ includeActor: true });
    return { ok: false as const, status: 409, error: "This campaign is no longer accepting plays.", ...current };
  }

  const score = Math.max(0, Math.min(999999, Math.floor(Number(input.score || 0))));
  const rttMs = Math.max(0, Math.min(5000, Math.floor(Number(input.rttMs ?? 0))));
  const scoreMs = scoreToScoreMs(score);
  const playCost = resolvePlayCostCredits(item);

  // Spend credits (free daily credits first, then paid). Paid portion becomes discount.
  let spend: { freeUsed: number; paidUsed: number };
  try {
    const result = await spendCredits(actor.user.id, playCost, `pwnit2:${item.id}`, "ATTEMPT_SPEND");
    spend = { freeUsed: Number(result.freeUsed ?? 0), paidUsed: Number(result.paidUsed ?? 0) };
  } catch {
    const current = await getPwnit2CampaignSnapshot({ includeActor: true });
    return {
      ok: false as const,
      status: 402,
      error: "Not enough credits to play.",
      needCredits: true,
      playCostCredits: playCost,
      ...current,
    };
  }

  const flags = flagsToString(flagAttempt({ scoreMs, rttMs }));

  await prisma.$transaction(async (tx) => {
    await tx.attempt.create({
      data: {
        userId: actor.user.id,
        itemId: item.id,
        roundId: round.id,
        dayKey: dayKeyZA(),
        costCredits: playCost,
        freeUsed: spend.freeUsed,
        paidUsed: spend.paidUsed,
        isPaid: spend.paidUsed > 0,
        scoreMs,
        flags,
      } as any,
    });

    await tx.itemRound.update({
      where: { id: round.id },
      data: {
        attemptCount: { increment: 1 },
        paidCreditsCollected: { increment: spend.paidUsed },
        freeCreditsCollected: { increment: spend.freeUsed },
      },
    });

    if (spend.paidUsed > 0) {
      await tx.creditLedger.create({
        data: {
          userId: actor.user.id,
          itemId: item.id,
          roundId: round.id,
          kind: "PWNIT2_DISCOUNT_EARNED",
          credits: spend.paidUsed,
          note: `R${spend.paidUsed} discount earned on ${ITEM_TITLE}`,
        },
      });
    }
  });

  // Funding-based activation may trip immediately now that credits were collected.
  await syncRoundLifecycle(item.id);

  const current = await getPwnit2CampaignSnapshot({ includeActor: true });
  const myRank = current.leaderboard.find((entry) => entry.isYou)?.rank ?? null;
  return {
    ok: true as const,
    myRank,
    discountEarnedZAR: spend.paidUsed,
    creditsSpent: playCost,
    ...current,
  };
}

// ── Purchase: quote + confirm ─────────────────────────────────────────────────
export async function getPwnit2PurchaseView() {
  const { snapshot } = await getPwnit2CampaignSnapshot({ includeActor: true });
  return snapshot;
}

export async function confirmPwnit2Purchase() {
  const actor = await getCurrentActor();
  const { item, round } = await getContext();

  const activated = isActivatedState(round.state);
  const growth = computeVoucherValue(
    pwnit2GrowthConfigFromEnv({
      baseValueZAR: BASE_VALUE_ZAR,
      paidCollectedZAR: Number(round.paidCreditsCollected ?? 0),
      activated,
    }),
  );

  const quote = await buildPurchaseQuote({
    item,
    round,
    userId: actor.user.id,
    currentValueZAR: growth.currentValueZAR,
  });

  if (quote.isWinnerYou) {
    return { ok: false as const, status: 400, error: "You won this voucher — no need to buy it." };
  }
  if (quote.alreadyPurchased) {
    return { ok: false as const, status: 400, error: "You have already purchased this voucher." };
  }
  if (!quote.canBuy) {
    return { ok: false as const, status: 409, error: "This voucher is not available to buy right now." };
  }

  const tierKey = tierKeyFromTierNumber(item.tier);
  const discountPct = discountPctForTierKey(tierKey);
  const yourPaidUsed = await getUserPaidUsed(item.id, round.id, actor.user.id);
  const voucherCode = `PW2-${Math.random().toString(36).toUpperCase().slice(2, 8)}`;
  const dayKey = dayKeyZA();

  await prisma.$transaction(async (tx) => {
    // Apply wallet credits toward the payable amount (dummy/test purchase).
    if (quote.walletAppliedZAR > 0) {
      await tx.user.update({
        where: { id: actor.user.id },
        data: { paidCreditsBalance: { decrement: quote.walletAppliedZAR } },
      });
    }

    await tx.itemPurchase.create({
      data: {
        itemId: item.id,
        roundId: round.id,
        userId: actor.user.id,
        dayKey,
        priceCredits: quote.voucherValueZAR,
        spentCredits: yourPaidUsed,
        discountPct,
        discountCredits: quote.yourDiscountZAR,
        payCredits: quote.payableZAR,
        tierKey,
      } as any,
    });

    if (quote.yourDiscountZAR > 0) {
      await tx.creditLedger.create({
        data: {
          userId: actor.user.id,
          itemId: item.id,
          roundId: round.id,
          kind: "PWNIT2_DISCOUNT_REDEEMED",
          credits: quote.yourDiscountZAR,
          note: `R${quote.yourDiscountZAR} discount applied to ${ITEM_TITLE} purchase`,
        },
      });
    }

    await tx.creditLedger.create({
      data: {
        userId: actor.user.id,
        itemId: item.id,
        roundId: round.id,
        kind: "PWNIT2_PURCHASE",
        credits: quote.payableZAR,
        note: `Purchased ${ITEM_TITLE} (voucher ${voucherCode})`,
      },
    });
  });

  return {
    ok: true as const,
    voucherCode,
    voucherValueZAR: quote.voucherValueZAR,
    discountAppliedZAR: quote.yourDiscountZAR,
    paidZAR: quote.payableZAR,
  };
}
