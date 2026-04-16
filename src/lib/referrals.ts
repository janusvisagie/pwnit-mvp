import { randomBytes } from "crypto";

import { Prisma } from "@prisma/client";
import { cookies, headers } from "next/headers";

import { getCurrentActor } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const REFERRAL_COOKIE = "pwnit_referral";
export const REFERRAL_ITEM_COOKIE = "pwnit_referral_item";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
export const REFERRAL_VERIFIED_SUBSCRIBER_CREDITS = 10;
export const REFERRAL_REWARD_VALUE = 10;
export const REFERRAL_DEFAULT_REWARD_TYPE = "CREDITS";
export const REFERRAL_REWARD_TYPES = {
  CREDITS: "CREDITS",
  DISCOUNT: "DISCOUNT",
} as const;

const REFERRAL_CODE_RE = /^[A-Z0-9]{6,12}$/;

export type ReferralRewardType = keyof typeof REFERRAL_REWARD_TYPES;

export type MonthlyReferralLeaderboardEntry = {
  rank: number;
  userId: string;
  label: string;
  qualifiedReferrals: number;
};

export function normalizeReferralCode(raw: unknown) {
  const value = String(raw ?? "").trim().toUpperCase();
  return REFERRAL_CODE_RE.test(value) ? value : null;
}

export function normalizeReferralRewardType(raw: unknown): ReferralRewardType {
  return String(raw ?? "").toUpperCase() === REFERRAL_REWARD_TYPES.DISCOUNT
    ? REFERRAL_REWARD_TYPES.DISCOUNT
    : REFERRAL_REWARD_TYPES.CREDITS;
}

export function getReferralCodeFromRequest() {
  try {
    return (
      normalizeReferralCode(cookies().get(REFERRAL_COOKIE)?.value) ||
      normalizeReferralCode(headers().get("x-pwnit-referral-code"))
    );
  } catch {
    return null;
  }
}

export function getReferralItemIdFromRequest() {
  try {
    const raw = String(
      cookies().get(REFERRAL_ITEM_COOKIE)?.value || headers().get("x-pwnit-referral-item") || "",
    ).trim();
    return raw || null;
  } catch {
    return null;
  }
}

function makeReferralCode() {
  return randomBytes(5).toString("base64url").replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase();
}

function monthStartUtc(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthLabel(date = new Date()) {
  return date.toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
  });
}

function actorLabel(user: { alias?: string | null; email?: string | null }) {
  const alias = String(user.alias ?? "").trim();
  if (alias) return alias;
  const email = String(user.email ?? "").trim();
  if (email) return email.split("@")[0] || email;
  return "Player";
}


function isMissingColumnError(error: unknown, columnName?: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2022") {
    return false;
  }
  if (!columnName) return true;
  const actual = String((error.meta as { column?: unknown } | undefined)?.column ?? "");
  return actual.includes(columnName);
}


export async function ensureReferralCodeForUser(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, isGuest: true },
  });

  if (!existing || existing.isGuest) return null;
  const normalizedExisting = normalizeReferralCode(existing.referralCode);
  if (normalizedExisting) return normalizedExisting;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = makeReferralCode();
    const collision = await prisma.user.findFirst({
      where: { referralCode: code },
      select: { id: true },
    });

    if (collision) continue;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
      select: { referralCode: true },
    });
    return normalizeReferralCode(updated.referralCode);
  }

  throw new Error("Could not create a unique referral code.");
}

export async function getAvailableReferralDiscountZAR(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralDiscountBalanceZAR: true },
    });
    return Math.max(0, Number((user as { referralDiscountBalanceZAR?: unknown } | null)?.referralDiscountBalanceZAR ?? 0));
  } catch (error) {
    if (isMissingColumnError(error, "User.referralDiscountBalanceZAR")) {
      return 0;
    }
    throw error;
  }
}

export async function setReferralRewardPreference(userId: string, preference: ReferralRewardType) {
  const normalized = normalizeReferralRewardType(preference);
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { referralRewardPreference: normalized },
    });
    return normalized;
  } catch (error) {
    if (isMissingColumnError(error, "User.referralRewardPreference")) {
      return REFERRAL_DEFAULT_REWARD_TYPE;
    }
    throw error;
  }
}

export function buildReferralDiscountQuote(params: {
  basePriceCredits: number;
  availableReferralDiscountZAR: number;
}) {
  const basePriceCredits = Math.max(0, Number(params.basePriceCredits || 0));
  const availableReferralDiscountZAR = Math.max(0, Number(params.availableReferralDiscountZAR || 0));
  const referralDiscountAppliedZAR = Math.min(basePriceCredits, availableReferralDiscountZAR);
  const amountDueCredits = Math.max(0, basePriceCredits - referralDiscountAppliedZAR);

  return {
    basePriceCredits,
    availableReferralDiscountZAR,
    referralDiscountAppliedZAR,
    amountDueCredits,
  };
}

export async function consumeReferralDiscountForPurchase(
  tx: Prisma.TransactionClient,
  params: {
    userId: string;
    itemId: string;
    roundId?: string | null;
    basePriceCredits: number;
    itemTitle: string;
  },
) {
  try {
    const user = await tx.user.findUnique({
      where: { id: params.userId },
      select: { referralDiscountBalanceZAR: true },
    });

    const quote = buildReferralDiscountQuote({
      basePriceCredits: params.basePriceCredits,
      availableReferralDiscountZAR: Math.max(
        0,
        Number((user as { referralDiscountBalanceZAR?: unknown } | null)?.referralDiscountBalanceZAR ?? 0),
      ),
    });

    if (quote.referralDiscountAppliedZAR > 0) {
      await tx.user.update({
        where: { id: params.userId },
        data: {
          referralDiscountBalanceZAR: { decrement: quote.referralDiscountAppliedZAR },
        },
      });

      await tx.creditLedger.create({
        data: {
          userId: params.userId,
          itemId: params.itemId,
          roundId: params.roundId ?? null,
          kind: "REFERRAL_DISCOUNT_REDEEMED",
          credits: 0,
          note: `Referral discount used on ${params.itemTitle}: R${quote.referralDiscountAppliedZAR}.`,
        },
      });
    }

    return quote;
  } catch (error) {
    if (isMissingColumnError(error, "User.referralDiscountBalanceZAR")) {
      return buildReferralDiscountQuote({
        basePriceCredits: params.basePriceCredits,
        availableReferralDiscountZAR: 0,
      });
    }
    throw error;
  }
}

async function applyReferralGrowthSplit(
  tx: Prisma.TransactionClient,
  params: {
    referrerUserId: string;
    referredUserId: string;
    referralId: string;
    sharedItemId?: string | null;
  },
) {
  let rewardType: ReferralRewardType = REFERRAL_DEFAULT_REWARD_TYPE;
  try {
    const referrer = await tx.user.findUnique({
      where: { id: params.referrerUserId },
      select: { referralRewardPreference: true },
    });
    rewardType = normalizeReferralRewardType(
      (referrer as { referralRewardPreference?: unknown } | null)?.referralRewardPreference,
    );
  } catch (error) {
    if (!isMissingColumnError(error, "User.referralRewardPreference")) {
      throw error;
    }
  }

  const ledgerRows: Prisma.CreditLedgerCreateManyInput[] = [];

  if (params.sharedItemId) {
    try {
      const round = await tx.itemRound.findFirst({
        where: { itemId: params.sharedItemId, state: "BUILDING" },
        orderBy: [{ sequence: "desc" }],
        select: {
          id: true,
          itemId: true,
          state: true,
          paidCreditsCollected: true,
          freeCreditsCollected: true,
          verifiedSubscriberCreditsCollected: true,
          activationTargetCredits: true,
        },
      });

      if (round && round.state === "BUILDING") {
        const current =
          Math.max(0, Number(round.paidCreditsCollected ?? 0)) +
          Math.max(0, Number(round.freeCreditsCollected ?? 0)) +
          Math.max(0, Number((round as { verifiedSubscriberCreditsCollected?: unknown }).verifiedSubscriberCreditsCollected ?? 0));
        const remaining = Math.max(0, Number(round.activationTargetCredits ?? 0) - current);
        const supportCredits = Math.min(REFERRAL_VERIFIED_SUBSCRIBER_CREDITS, remaining);

        if (supportCredits > 0) {
          await tx.itemRound.update({
            where: { id: round.id },
            data: {
              verifiedSubscriberCreditsCollected: { increment: supportCredits },
            },
          });

          ledgerRows.push({
            userId: params.referrerUserId,
            itemId: round.itemId,
            roundId: round.id,
            kind: "VERIFIED_SUBSCRIBER_CONTRIBUTION",
            credits: supportCredits,
            note: `Verified subscriber contribution added to this shared prize (+${supportCredits}).`,
          });
        }
      }
    } catch (error) {
      if (!isMissingColumnError(error, "ItemRound.verifiedSubscriberCreditsCollected")) {
        throw error;
      }
    }
  }

  if (rewardType === REFERRAL_REWARD_TYPES.DISCOUNT) {
    try {
      await tx.user.update({
        where: { id: params.referrerUserId },
        data: { referralDiscountBalanceZAR: { increment: REFERRAL_REWARD_VALUE } },
      });
      ledgerRows.push({
        userId: params.referrerUserId,
        kind: "REFERRAL_BONUS_DISCOUNT",
        credits: 0,
        note: `Qualified referral reward: R${REFERRAL_REWARD_VALUE} added to your referral discount wallet.`,
      });
    } catch (error) {
      if (isMissingColumnError(error, "User.referralDiscountBalanceZAR")) {
        rewardType = REFERRAL_REWARD_TYPES.CREDITS;
      } else {
        throw error;
      }
    }
  }

  if (rewardType === REFERRAL_REWARD_TYPES.CREDITS) {
    await tx.user.update({
      where: { id: params.referrerUserId },
      data: { freeCreditsBalance: { increment: REFERRAL_REWARD_VALUE } },
    });
    ledgerRows.push({
      userId: params.referrerUserId,
      kind: "REFERRAL_BONUS_CREDITS",
      credits: REFERRAL_REWARD_VALUE,
      note: `Qualified referral reward: +${REFERRAL_REWARD_VALUE} bonus credits.`,
    });
  }

  if (ledgerRows.length) {
    await tx.creditLedger.createMany({ data: ledgerRows });
  }

  try {
    await tx.referral.update({
      where: { id: params.referralId },
      data: {
        referrerRewardCredits: REFERRAL_REWARD_VALUE,
        referrerRewardType: rewardType,
        referredRewardCredits: 0,
        qualifiedAt: new Date(),
        rewardedAt: new Date(),
        status: "CREDITED",
        referredUserId: params.referredUserId,
      },
    });
  } catch (error) {
    if (isMissingColumnError(error, "Referral.referrerRewardType")) {
      await tx.referral.update({
        where: { id: params.referralId },
        data: {
          referrerRewardCredits: REFERRAL_REWARD_VALUE,
          referredRewardCredits: 0,
          qualifiedAt: new Date(),
          rewardedAt: new Date(),
          status: "CREDITED",
          referredUserId: params.referredUserId,
        },
      });
    } else {
      throw error;
    }
  }
}

async function settlePendingReferral(referralId: string, referredUserId: string) {
  return prisma.$transaction(async (tx) => {
    let referral: { id: string; status: string; referrerUserId: string; sharedItemId?: string | null } | null = null;

    try {
      referral = await tx.referral.findUnique({
        where: { id: referralId },
        select: {
          id: true,
          status: true,
          referrerUserId: true,
          sharedItemId: true,
        },
      });
    } catch (error) {
      if (isMissingColumnError(error, "Referral.sharedItemId")) {
        referral = await tx.referral.findUnique({
          where: { id: referralId },
          select: {
            id: true,
            status: true,
            referrerUserId: true,
          },
        }) as typeof referral;
      } else {
        throw error;
      }
    }

    if (!referral || referral.status === "CREDITED") return null;

    await applyReferralGrowthSplit(tx, {
      referralId: referral.id,
      referrerUserId: referral.referrerUserId,
      referredUserId,
      sharedItemId: referral.sharedItemId ?? null,
    });

    return true;
  });
}

export async function maybeTrackReferralProgressForCurrentActor() {
  const actor = await getCurrentActor();
  if (actor.isLocalDev || actor.isDemoUser) return;

  const code = getReferralCodeFromRequest();
  if (!code) return;

  const sharedItemId = getReferralItemIdFromRequest();
  const referrer = await prisma.user.findFirst({
    where: { referralCode: code, isGuest: false },
    select: { id: true, email: true },
  });

  if (!referrer || referrer.id === actor.user.id) return;

  const attemptCount = await prisma.attempt.count({ where: { userId: actor.user.id } });

  let existing: {
    id: string;
    referrerUserId: string;
    referredUserId: string | null;
    status: string;
    sharedItemId?: string | null;
  } | null = null;

  try {
    existing = await prisma.referral.findUnique({
      where: { referredBucketKey: actor.bucketKey },
      select: {
        id: true,
        referrerUserId: true,
        referredUserId: true,
        status: true,
        sharedItemId: true,
      },
    });
  } catch (error) {
    if (isMissingColumnError(error, "Referral.sharedItemId")) {
      existing = await prisma.referral.findUnique({
        where: { referredBucketKey: actor.bucketKey },
        select: {
          id: true,
          referrerUserId: true,
          referredUserId: true,
          status: true,
        },
      }) as typeof existing;
    } else {
      throw error;
    }
  }

  if (!existing) {
    if (attemptCount <= 0) {
      try {
        await prisma.referral.create({
          data: {
            code,
            referrerUserId: referrer.id,
            referredUserId: actor.isGuest ? null : actor.user.id,
            referredBucketKey: actor.bucketKey,
            sharedItemId,
            status: "PENDING",
            referrerRewardCredits: REFERRAL_REWARD_VALUE,
            referrerRewardType: REFERRAL_DEFAULT_REWARD_TYPE,
            referredRewardCredits: 0,
          },
        });
      } catch (error) {
        if (isMissingColumnError(error, "Referral.sharedItemId") || isMissingColumnError(error, "Referral.referrerRewardType")) {
          try {
            await prisma.referral.create({
              data: {
                code,
                referrerUserId: referrer.id,
                referredUserId: actor.isGuest ? null : actor.user.id,
                referredBucketKey: actor.bucketKey,
                status: "PENDING",
                referrerRewardCredits: REFERRAL_REWARD_VALUE,
                referredRewardCredits: 0,
              },
            });
          } catch (fallbackError) {
            if (!(fallbackError instanceof Prisma.PrismaClientKnownRequestError && fallbackError.code === "P2002")) {
              throw fallbackError;
            }
          }
        } else if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
          throw error;
        }
      }
      return;
    }

    try {
      await prisma.$transaction(async (tx) => {
        let created: { id: string };
        try {
          created = await tx.referral.create({
            data: {
              code,
              referrerUserId: referrer.id,
              referredUserId: actor.user.id,
              referredBucketKey: actor.bucketKey,
              sharedItemId,
              status: "PENDING",
              referrerRewardCredits: REFERRAL_REWARD_VALUE,
              referrerRewardType: REFERRAL_DEFAULT_REWARD_TYPE,
              referredRewardCredits: 0,
            },
            select: { id: true },
          });
        } catch (error) {
          if (!isMissingColumnError(error, "Referral.sharedItemId") && !isMissingColumnError(error, "Referral.referrerRewardType")) {
            throw error;
          }
          created = await tx.referral.create({
            data: {
              code,
              referrerUserId: referrer.id,
              referredUserId: actor.user.id,
              referredBucketKey: actor.bucketKey,
              status: "PENDING",
              referrerRewardCredits: REFERRAL_REWARD_VALUE,
              referredRewardCredits: 0,
            },
            select: { id: true },
          });
        }

        await applyReferralGrowthSplit(tx, {
          referralId: created.id,
          referrerUserId: referrer.id,
          referredUserId: actor.user.id,
          sharedItemId,
        });
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
        throw error;
      }
    }
    return;
  }

  if (existing.referrerUserId !== referrer.id) {
    return;
  }

  if ((!existing.sharedItemId || existing.sharedItemId.trim() === "") && sharedItemId) {
    try {
      await prisma.referral.update({
        where: { id: existing.id },
        data: { sharedItemId },
      });
    } catch (error) {
      if (!isMissingColumnError(error, "Referral.sharedItemId")) {
        throw error;
      }
    }
  }

  if (!existing.referredUserId && !actor.isGuest) {
    await prisma.referral.update({ where: { id: existing.id }, data: { referredUserId: actor.user.id } });
  }

  if (existing.status === "PENDING" && attemptCount > 0) {
    await settlePendingReferral(existing.id, actor.user.id);
  }
}

async function getMonthlyReferralLeaderboard(actorUserId?: string | null) {
  const start = monthStartUtc();
  const grouped = await prisma.referral.groupBy({
    by: ["referrerUserId"],
    where: { status: "CREDITED", rewardedAt: { gte: start } },
    _count: { _all: true },
  });

  if (!grouped.length) {
    return {
      monthLabel: monthLabel(),
      leaderboard: [] as MonthlyReferralLeaderboardEntry[],
      myMonthlyRank: null as number | null,
    };
  }

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((row) => row.referrerUserId) } },
    select: { id: true, alias: true, email: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));

  const leaderboard = grouped
    .map((row) => ({
      userId: row.referrerUserId,
      qualifiedReferrals: Number(row._count._all ?? 0),
      label: actorLabel(userMap.get(row.referrerUserId) ?? {}),
    }))
    .sort((a, b) => {
      if (b.qualifiedReferrals !== a.qualifiedReferrals) return b.qualifiedReferrals - a.qualifiedReferrals;
      return a.label.localeCompare(b.label);
    })
    .map((entry, index) => ({ rank: index + 1, ...entry }));

  const myMonthlyRank = actorUserId ? leaderboard.find((entry) => entry.userId === actorUserId)?.rank ?? null : null;
  return { monthLabel: monthLabel(), leaderboard, myMonthlyRank };
}

export async function getReferralPageData() {
  const actor = await getCurrentActor();
  const incomingCode = getReferralCodeFromRequest();

  let activeReferral: any = null;
  try {
    activeReferral = await prisma.referral.findUnique({
      where: { referredBucketKey: actor.bucketKey },
      include: { referrer: { select: { alias: true, email: true } } },
    });
  } catch (error) {
    if (isMissingColumnError(error, "Referral.sharedItemId") || isMissingColumnError(error, "Referral.referrerRewardType")) {
      activeReferral = await prisma.referral.findUnique({
        where: { referredBucketKey: actor.bucketKey },
        select: {
          id: true,
          code: true,
          status: true,
          referrerUserId: true,
          referredUserId: true,
          referredBucketKey: true,
          createdAt: true,
          updatedAt: true,
          qualifiedAt: true,
          rewardedAt: true,
          referrerRewardCredits: true,
          referredRewardCredits: true,
          referrer: { select: { alias: true, email: true } },
        },
      });
    } else {
      throw error;
    }
  }

  const monthly = await getMonthlyReferralLeaderboard(actor.isGuest || actor.isDemoUser ? null : actor.user.id);

  if (actor.isGuest || actor.isDemoUser) {
    return {
      actor,
      myCode: null,
      shareUrl: null,
      incomingCode,
      activeReferral,
      referrals: [],
      creditedCount: 0,
      pendingCount: 0,
      totalEarnedCredits: 0,
      totalEarnedDiscountZAR: 0,
      availableReferralDiscountZAR: 0,
      rewardPreference: REFERRAL_DEFAULT_REWARD_TYPE,
      monthlyLeaderboard: monthly.leaderboard,
      monthlyLabel: monthly.monthLabel,
      myMonthlyRank: monthly.myMonthlyRank,
    };
  }

  const referralsPromise = prisma.referral.findMany({
    where: { referrerUserId: actor.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { referred: { select: { alias: true, email: true } } },
  }).catch(async (error) => {
    if (!(isMissingColumnError(error, "Referral.sharedItemId") || isMissingColumnError(error, "Referral.referrerRewardType"))) {
      throw error;
    }
    return prisma.referral.findMany({
      where: { referrerUserId: actor.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        status: true,
        referredUserId: true,
        referrerRewardCredits: true,
        referredRewardCredits: true,
        referred: { select: { alias: true, email: true } },
      },
    }) as Promise<any[]>;
  });

  const userRowPromise = prisma.user.findUnique({
    where: { id: actor.user.id },
    select: { referralDiscountBalanceZAR: true, referralRewardPreference: true },
  }).catch((error) => {
    if (!(isMissingColumnError(error, "User.referralDiscountBalanceZAR") || isMissingColumnError(error, "User.referralRewardPreference"))) {
      throw error;
    }
    return null;
  });

  const [myCode, referrals, userRow] = await Promise.all([
    ensureReferralCodeForUser(actor.user.id),
    referralsPromise,
    userRowPromise,
  ]);

  const credited = referrals.filter((entry: any) => entry.status === "CREDITED");
  const creditedCount = credited.length;
  const pendingCount = referrals.filter((entry: any) => entry.status === "PENDING").length;
  const totalEarnedCredits = credited
    .filter(
      (entry: any) =>
        normalizeReferralRewardType((entry as { referrerRewardType?: unknown }).referrerRewardType) ===
        REFERRAL_REWARD_TYPES.CREDITS,
    )
    .reduce((sum: number, entry: any) => sum + Number(entry.referrerRewardCredits ?? 0), 0);
  const totalEarnedDiscountZAR = credited
    .filter(
      (entry: any) =>
        normalizeReferralRewardType((entry as { referrerRewardType?: unknown }).referrerRewardType) ===
        REFERRAL_REWARD_TYPES.DISCOUNT,
    )
    .reduce((sum: number, entry: any) => sum + Number(entry.referrerRewardCredits ?? 0), 0);

  const siteUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    actor,
    myCode,
    shareUrl: myCode ? `${siteUrl.replace(/\/$/, "")}/?ref=${encodeURIComponent(myCode)}` : null,
    incomingCode,
    activeReferral,
    referrals,
    creditedCount,
    pendingCount,
    totalEarnedCredits,
    totalEarnedDiscountZAR,
    availableReferralDiscountZAR: Math.max(0, Number((userRow as { referralDiscountBalanceZAR?: unknown } | null)?.referralDiscountBalanceZAR ?? 0)),
    rewardPreference: normalizeReferralRewardType((userRow as { referralRewardPreference?: unknown } | null)?.referralRewardPreference),
    monthlyLeaderboard: monthly.leaderboard,
    monthlyLabel: monthly.monthLabel,
    myMonthlyRank: monthly.myMonthlyRank,
  };
}
