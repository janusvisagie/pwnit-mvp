// src/lib/pwnit2CampaignServer.ts
//
// PwnIt 2 voucher campaigns wired onto the REAL PwnIt 1 engine (rounds.ts + settle.ts
// + pricing.ts + credits.ts). Now config-driven for TWO campaigns:
//   - hero   (R1,000 shopping voucher)  — the acquisition draw
//   - staple (R100 airtime voucher)     — the cheap, fast-activating daily item
//
// Each function takes a campaign slug ("hero" | "staple") and resolves the matching
// Item. The single-item flow is preserved per campaign; listPwnit2Campaigns() returns
// both for the board. Defaults to "hero" so older callers keep working.

import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth";
import { dayKeyZA } from "@/lib/time";
import { flagAttempt, flagsToString } from "@/lib/antiCheat";
import { spendCredits } from "@/lib/credits";
import { resolvePlayCostCredits } from "@/lib/playCost";
import { buyPriceAfterSpend, tierKeyFromTierNumber, discountPctForTierKey } from "@/lib/pricing";
import { ensureCurrentRound, syncRoundLifecycle, activationTargetForItem, publicProgress } from "@/lib/rounds";
import { computeVoucherValue, pwnit2GrowthConfigFromEnv } from "@/lib/pwnit2Growth";
import type { Pwnit2CampaignSnapshot, Pwnit2LeaderboardEntry } from "@/lib/pwnit2DemoCampaign";

export type Pwnit2Slug = "hero" | "staple";

type CampaignConfig = {
  slug: Pwnit2Slug;
  title: string;
  category: string;
  gameTitle: string;
  gameKey: string;
  baseValueZAR: number;
  playCostCredits: number;
  activationEntries: number;
  countdownMinutes: number;
  statusWindowHours: number;
  sortOrder: number;
  shortDesc: string;
  legacyTitles: string[]; // existing titles/keys to adopt as this campaign (avoid duplicates)
  legacyGameKeys: string[];
};

const PLAY_COST_CREDITS = Number(process.env.PWNIT2_PLAY_COST_CREDITS ?? "5");
const COUNTDOWN_MINUTES = Number(process.env.PWNIT2_COUNTDOWN_MINUTES ?? "30");
const STATUS_WINDOW_HOURS = Number(process.env.PWNIT2_STATUS_WINDOW_HOURS ?? "24");

const CAMPAIGNS: CampaignConfig[] = [
  {
    slug: "hero",
    title: process.env.PWNIT2_HERO_TITLE ?? "R1,000 Shopping Voucher",
    category: "Hero campaign",
    gameTitle: "PwnIt Gauntlet",
    gameKey: "pwnit2:hero",
    baseValueZAR: Number(process.env.PWNIT2_HERO_VALUE_ZAR ?? "1000"),
    playCostCredits: PLAY_COST_CREDITS,
    activationEntries: Number(process.env.PWNIT2_HERO_ACTIVATION_PLAYS ?? "20"),
    countdownMinutes: COUNTDOWN_MINUTES,
    statusWindowHours: STATUS_WINDOW_HOURS,
    sortOrder: 1,
    shortDesc: "PwnIt hero voucher campaign",
    legacyTitles: ["Checkers Voucher"],
    legacyGameKeys: ["pwnit-2-number-chain"],
  },
  {
    slug: "staple",
    title: process.env.PWNIT2_STAPLE_TITLE ?? "R100 Airtime Voucher",
    category: "Daily staple",
    gameTitle: "PwnIt Gauntlet",
    gameKey: "pwnit2:staple",
    baseValueZAR: Number(process.env.PWNIT2_STAPLE_VALUE_ZAR ?? "100"),
    playCostCredits: PLAY_COST_CREDITS,
    activationEntries: Number(process.env.PWNIT2_STAPLE_ACTIVATION_PLAYS ?? "5"),
    countdownMinutes: COUNTDOWN_MINUTES,
    statusWindowHours: STATUS_WINDOW_HOURS,
    sortOrder: 2,
    shortDesc: "PwnIt daily staple campaign",
    legacyTitles: [],
    legacyGameKeys: [],
  },
];

function cfgFor(slug: string | null | undefined): CampaignConfig {
  return CAMPAIGNS.find((c) => c.slug === slug) ?? CAMPAIGNS[0];
}

const SCORE_OFFSET = 1_000_000;
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
  slug: Pwnit2Slug;
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

async function ensurePwnit2Item(cfg: CampaignConfig) {
  const or: any[] = [{ gameKey: cfg.gameKey }];
  for (const t of cfg.legacyTitles) or.push({ title: t });
  for (const k of cfg.legacyGameKeys) or.push({ gameKey: k });

  const existing = await prisma.item.findFirst({ where: { OR: or }, orderBy: { createdAt: "asc" } });

  const config = {
    title: cfg.title,
    prizeType: "VOUCHER",
    prizeValueZAR: cfg.baseValueZAR,
    landedCostZAR: cfg.baseValueZAR,
    playCostCredits: cfg.playCostCredits,
    purchaseGraceHours: cfg.statusWindowHours,
    activationGoalEntries: cfg.activationEntries,
    countdownMinutes: cfg.countdownMinutes,
    gameKey: cfg.gameKey,
    isHero: cfg.slug === "hero",
    shortDesc: cfg.shortDesc,
  };

  if (existing) {
    return prisma.item.update({ where: { id: existing.id }, data: config as any });
  }
  return prisma.item.create({
    data: { tier: 1, sortOrder: cfg.sortOrder, state: "OPEN", fundingWindowHours: 168, ...config } as any,
  });
}

async function reconcileRoundTarget(item: any, round: any) {
  if (!round || round.state !== "BUILDING") return round;
  const target = activationTargetForItem(item);
  if (Number(round.activationTargetCredits) !== target) {
    return prisma.itemRound.update({ where: { id: round.id }, data: { activationTargetCredits: target } });
  }
  return round;
}

async function getContext(slug: string) {
  const cfg = cfgFor(slug);
  const item = await ensurePwnit2Item(cfg);
  await syncRoundLifecycle(item.id);
  let round = await ensureCurrentRound(item.id);
  round = await reconcileRoundTarget(item, round);
  return { cfg, item, round: round! };
}

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

async function getUserPaidUsed(itemId: string, roundId: string, userId: string) {
  const agg = await prisma.attempt.aggregate({ where: { itemId, roundId, userId }, _sum: { paidUsed: true } });
  return Math.max(0, Number(agg._sum.paidUsed ?? 0));
}

async function getUserPlayCounts(itemId: string, roundId: string, userId: string) {
  const [total, paid] = await Promise.all([
    prisma.attempt.count({ where: { itemId, roundId, userId } }),
    prisma.attempt.count({ where: { itemId, roundId, userId, isPaid: true } }),
  ]);
  return { total, paid };
}

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
  const wallet = await prisma.user.findUnique({ where: { id: userId }, select: { paidCreditsBalance: true } });

  const price = buyPriceAfterSpend({
    prizeValueZAR: currentValueZAR,
    tierNumber: item.tier,
    spentCredits: yourPaidUsed,
    walletCredits: Number(wallet?.paidCreditsBalance ?? 0),
  });

  const buyableState = ["ACTIVATED", "CLOSED", "PUBLISHED"].includes(round.state);

  return {
    voucherValueZAR: currentValueZAR,
    yourDiscountZAR: price.playDiscountCredits,
    payableZAR: price.newPriceCredits,
    walletAppliedZAR: price.walletAppliedCredits,
    topUpZAR: price.topUpCredits,
    canBuy: buyableState && !won && !alreadyPurchased,
    isWinnerYou: Boolean(won),
    alreadyPurchased: Boolean(alreadyPurchased),
  };
}

// ── Internal snapshot builder (actor passed in to avoid re-fetching) ──────────
async function snapshotFor(slug: string, actor: Awaited<ReturnType<typeof getCurrentActor>> | null) {
  const { cfg, item, round } = await getContext(slug);
  const userId = actor?.user?.id ?? null;

  const leaderboard = await getLeaderboard(item.id, round.id, userId);
  const progress = publicProgress(round);
  const activated = isActivatedState(round.state);

  const growth = computeVoucherValue(
    pwnit2GrowthConfigFromEnv({
      baseValueZAR: cfg.baseValueZAR,
      paidCollectedZAR: Number(round.paidCreditsCollected ?? 0),
      activated,
    }),
  );

  const top = leaderboard[0] ?? null;
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
  const q = `?item=${cfg.slug}`;
  const helper =
    state === "FUNDING"
      ? "Play the memory game to help unlock the countdown. Paid plays also build your discount on this voucher."
      : state === "COUNTDOWN"
        ? "The countdown is live. Keep playing to climb the leaderboard and watch the voucher grow."
        : state === "STATUS_WINDOW"
          ? "The leaderboard is frozen. Use your discount to buy this voucher before the window closes."
          : "This campaign is archived.";

  const snapshot: Pwnit2SnapshotEx = {
    title: cfg.title,
    category: cfg.category,
    statusLabel: statusLabel(round.state),
    statusTone: statusTone(round.state),
    baseValueLabel: `R${cfg.baseValueZAR}`,
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
    gameTitle: cfg.gameTitle,
    gameHref: `/play/pwnit-2${q}`,
    leaderboardHref: `/pwnit-2/leaderboard${q}`,
    statusHref: `/pwnit-2/status${q}`,
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

    slug: cfg.slug,
    baseValueZAR: cfg.baseValueZAR,
    currentValueZAR: growth.currentValueZAR,
    growthZAR: growth.growthZAR,
    playCostCredits: resolvePlayCostCredits(item),
    yourDiscountZAR: yourPaidUsed,
    yourPaidPlays: counts.paid,
    yourTotalPlays: counts.total,
    isWinnerYou,
    purchase,
  };

  return { cfg, item, round, snapshot, leaderboard, actor };
}

// ── Public: one campaign ──────────────────────────────────────────────────────
export async function getPwnit2CampaignSnapshot(options: { slug?: string; includeActor?: boolean } = {}) {
  const actor = options.includeActor ? await getCurrentActor() : null;
  return snapshotFor(options.slug ?? "hero", actor);
}

// ── Public: all campaigns for the board ───────────────────────────────────────
export async function listPwnit2Campaigns(options: { includeActor?: boolean } = {}) {
  const actor = options.includeActor ? await getCurrentActor() : null;
  const campaigns = [];
  for (const cfg of CAMPAIGNS) {
    const res = await snapshotFor(cfg.slug, actor);
    campaigns.push({ slug: cfg.slug, campaign: res.snapshot, leaderboard: res.leaderboard });
  }
  return { campaigns };
}

// ── Record a play ─────────────────────────────────────────────────────────────
export async function submitPwnit2Score(input: {
  slug?: string;
  score: number;
  elapsedSeconds: number;
  correct: number;
  total: number;
  rttMs?: number;
}) {
  const slug = input.slug ?? "hero";
  const actor = await getCurrentActor();
  const { cfg, item, round } = await getContext(slug);

  if (!["BUILDING", "ACTIVATED"].includes(String(round.state))) {
    const current = await snapshotFor(slug, actor);
    return { ok: false as const, status: 409, error: "This campaign is no longer accepting plays.", ...current };
  }

  const score = Math.max(0, Math.min(999999, Math.floor(Number(input.score || 0))));
  const rttMs = Math.max(0, Math.min(5000, Math.floor(Number(input.rttMs ?? 0))));
  const scoreMs = scoreToScoreMs(score);
  const playCost = resolvePlayCostCredits(item);

  let spend: { freeUsed: number; paidUsed: number };
  try {
    const result = await spendCredits(actor.user.id, playCost, `pwnit2:${item.id}`, "ATTEMPT_SPEND");
    spend = { freeUsed: Number(result.freeUsed ?? 0), paidUsed: Number(result.paidUsed ?? 0) };
  } catch {
    const current = await snapshotFor(slug, actor);
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
          note: `R${spend.paidUsed} discount earned on ${cfg.title}`,
        },
      });
    }
  });

  await syncRoundLifecycle(item.id);

  const current = await snapshotFor(slug, actor);
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
export async function getPwnit2PurchaseView(slug?: string) {
  const { snapshot } = await getPwnit2CampaignSnapshot({ slug: slug ?? "hero", includeActor: true });
  return snapshot;
}

export async function confirmPwnit2Purchase(slug?: string) {
  const resolved = slug ?? "hero";
  const actor = await getCurrentActor();
  const { cfg, item, round } = await getContext(resolved);

  const activated = isActivatedState(round.state);
  const growth = computeVoucherValue(
    pwnit2GrowthConfigFromEnv({
      baseValueZAR: cfg.baseValueZAR,
      paidCollectedZAR: Number(round.paidCreditsCollected ?? 0),
      activated,
    }),
  );

  const quote = await buildPurchaseQuote({ item, round, userId: actor.user.id, currentValueZAR: growth.currentValueZAR });

  if (quote.isWinnerYou) return { ok: false as const, status: 400, error: "You won this voucher — no need to buy it." };
  if (quote.alreadyPurchased) return { ok: false as const, status: 400, error: "You have already purchased this voucher." };
  if (!quote.canBuy) return { ok: false as const, status: 409, error: "This voucher is not available to buy right now." };

  const tierKey = tierKeyFromTierNumber(item.tier);
  const discountPct = discountPctForTierKey(tierKey);
  const yourPaidUsed = await getUserPaidUsed(item.id, round.id, actor.user.id);
  const voucherCode = `PW2-${Math.random().toString(36).toUpperCase().slice(2, 8)}`;
  const dayKey = dayKeyZA();

  await prisma.$transaction(async (tx) => {
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
          note: `R${quote.yourDiscountZAR} discount applied to ${cfg.title} purchase`,
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
        note: `Purchased ${cfg.title} (voucher ${voucherCode})`,
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
