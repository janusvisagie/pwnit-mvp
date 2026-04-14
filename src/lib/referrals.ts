import { randomBytes } from "crypto";

import { Prisma } from "@prisma/client";
import { cookies, headers } from "next/headers";

import { getCurrentActor } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const REFERRAL_COOKIE = "pwnit_referral";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
export const REFERRAL_ACTIVATION_SUPPORT = 5;
export const REFERRAL_REFERRER_BONUS = 5;
export const REFERRAL_REFRIEND_BONUS = 0;

const REFERRAL_CODE_RE = /^[A-Z0-9]{6,12}$/;

export type MonthlyReferralLeaderboardEntry = {
  rank: number;
  userId: string;
  label: string;
  qualifiedReferrals: number;
  bonusCredits: number;
};

export function normalizeReferralCode(raw: unknown) {
  const value = String(raw ?? "").trim().toUpperCase();
  return REFERRAL_CODE_RE.test(value) ? value : null;
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

async function applyReferralGrowthSplit(
  tx: Prisma.TransactionClient,
  {
    referrerUserId,
    referredUserId,
    referrerRewardCredits,
    referredRewardCredits,
  }: {
    referrerUserId: string;
    referredUserId: string;
    referrerRewardCredits: number;
    referredRewardCredits: number;
  },
) {
  const bonusCredits = Math.max(0, Number(referrerRewardCredits || 0));
  const welcomeCredits = Math.max(0, Number(referredRewardCredits || 0));
  const ledgerRows: Prisma.CreditLedgerCreateManyInput[] = [];

  if (bonusCredits > 0) {
    await tx.user.update({
      where: { id: referrerUserId },
      data: {
        freeCreditsBalance: { increment: bonusCredits },
      },
    });

    ledgerRows.push({
      userId: referrerUserId,
      kind: "REFERRAL_BONUS",
      credits: bonusCredits,
      note: `Referral bonus after your friend completed a first real play (+${bonusCredits} credits).`,
    });
  }

  if (welcomeCredits > 0) {
    await tx.user.update({
      where: { id: referredUserId },
      data: {
        freeCreditsBalance: { increment: welcomeCredits },
      },
    });

    ledgerRows.push({
      userId: referredUserId,
      kind: "REFERRED_WELCOME",
      credits: welcomeCredits,
      note: `Welcome bonus for joining with a referral and completing a first real play (+${welcomeCredits} credits).`,
    });
  }

  const firstAttempt = await tx.attempt.findFirst({
    where: { userId: referredUserId },
    orderBy: [{ createdAt: "asc" }],
    select: {
      itemId: true,
      roundId: true,
    },
  });

  if (firstAttempt?.roundId && firstAttempt.itemId) {
    const round = await tx.itemRound.findUnique({
      where: { id: firstAttempt.roundId },
      select: {
        id: true,
        itemId: true,
        state: true,
      },
    });

    if (round && round.itemId === firstAttempt.itemId && round.state === "BUILDING") {
      await tx.itemRound.update({
        where: { id: round.id },
        data: {
          paidCreditsCollected: { increment: REFERRAL_ACTIVATION_SUPPORT },
        },
      });

      ledgerRows.push({
        userId: referrerUserId,
        itemId: round.itemId,
        roundId: round.id,
        kind: "REFERRAL_ACTIVATION_SUPPORT",
        credits: REFERRAL_ACTIVATION_SUPPORT,
        note: `Hidden activation support unlocked after a qualified referral started playing this prize (+${REFERRAL_ACTIVATION_SUPPORT}).`,
      });
    }
  }

  if (ledgerRows.length) {
    await tx.creditLedger.createMany({ data: ledgerRows });
  }
}

async function settlePendingReferral(referralId: string, referredUserId: string) {
  return prisma.$transaction(async (tx) => {
    const referral = await tx.referral.findUnique({
      where: { id: referralId },
      select: {
        id: true,
        status: true,
        referrerUserId: true,
        referredUserId: true,
        referrerRewardCredits: true,
        referredRewardCredits: true,
      },
    });

    if (!referral || referral.status === "CREDITED") return null;

    const now = new Date();

    await applyReferralGrowthSplit(tx, {
      referrerUserId: referral.referrerUserId,
      referredUserId,
      referrerRewardCredits: Number(referral.referrerRewardCredits ?? 0),
      referredRewardCredits: Number(referral.referredRewardCredits ?? 0),
    });

    await tx.referral.update({
      where: { id: referral.id },
      data: {
        referredUserId,
        status: "CREDITED",
        qualifiedAt: now,
        rewardedAt: now,
      },
    });

    return true;
  });
}

export async function maybeTrackReferralProgressForCurrentActor() {
  const actor = await getCurrentActor();

  if (actor.isLocalDev || actor.isDemoUser) return;

  const code = getReferralCodeFromRequest();
  if (!code) return;

  const referrer = await prisma.user.findFirst({
    where: {
      referralCode: code,
      isGuest: false,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!referrer || referrer.id === actor.user.id) return;

  const attemptCount = await prisma.attempt.count({
    where: { userId: actor.user.id },
  });

  const existing = await prisma.referral.findUnique({
    where: { referredBucketKey: actor.bucketKey },
    select: {
      id: true,
      referrerUserId: true,
      referredUserId: true,
      status: true,
    },
  });

  if (!existing) {
    if (attemptCount <= 0) {
      try {
        await prisma.referral.create({
          data: {
            code,
            referrerUserId: referrer.id,
            referredUserId: actor.isGuest ? null : actor.user.id,
            referredBucketKey: actor.bucketKey,
            status: "PENDING",
            referrerRewardCredits: REFERRAL_REFERRER_BONUS,
            referredRewardCredits: REFERRAL_REFRIEND_BONUS,
          },
        });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
          throw error;
        }
      }
      return;
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.referral.create({
          data: {
            code,
            referrerUserId: referrer.id,
            referredUserId: actor.user.id,
            referredBucketKey: actor.bucketKey,
            status: "CREDITED",
            qualifiedAt: new Date(),
            rewardedAt: new Date(),
            referrerRewardCredits: REFERRAL_REFERRER_BONUS,
            referredRewardCredits: REFERRAL_REFRIEND_BONUS,
          },
        });

        await applyReferralGrowthSplit(tx, {
          referrerUserId: referrer.id,
          referredUserId: actor.user.id,
          referrerRewardCredits: REFERRAL_REFERRER_BONUS,
          referredRewardCredits: REFERRAL_REFRIEND_BONUS,
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
    return; // first captured referral wins for this bucket
  }

  if (!existing.referredUserId && !actor.isGuest) {
    await prisma.referral.update({
      where: { id: existing.id },
      data: { referredUserId: actor.user.id },
    });
  }

  if (existing.status === "PENDING" && attemptCount > 0) {
    await settlePendingReferral(existing.id, actor.user.id);
  }
}

async function getMonthlyReferralLeaderboard(actorUserId?: string | null) {
  const start = monthStartUtc();
  const grouped = await prisma.referral.groupBy({
    by: ["referrerUserId"],
    where: {
      status: "CREDITED",
      rewardedAt: { gte: start },
    },
    _count: { _all: true },
    _sum: { referrerRewardCredits: true },
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
      bonusCredits: Number(row._sum.referrerRewardCredits ?? 0),
      label: actorLabel(userMap.get(row.referrerUserId) ?? {}),
    }))
    .sort((a, b) => {
      if (b.qualifiedReferrals !== a.qualifiedReferrals) return b.qualifiedReferrals - a.qualifiedReferrals;
      if (b.bonusCredits !== a.bonusCredits) return b.bonusCredits - a.bonusCredits;
      return a.label.localeCompare(b.label);
    })
    .map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

  const myMonthlyRank = actorUserId
    ? leaderboard.find((entry) => entry.userId === actorUserId)?.rank ?? null
    : null;

  return {
    monthLabel: monthLabel(),
    leaderboard,
    myMonthlyRank,
  };
}

export async function getReferralPageData() {
  const actor = await getCurrentActor();
  const incomingCode = getReferralCodeFromRequest();

  const activeReferral = await prisma.referral.findUnique({
    where: { referredBucketKey: actor.bucketKey },
    include: {
      referrer: {
        select: {
          alias: true,
          email: true,
        },
      },
    },
  });

  const monthly = await getMonthlyReferralLeaderboard(
    actor.isGuest || actor.isDemoUser ? null : actor.user.id,
  );

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
      monthlyLeaderboard: monthly.leaderboard,
      monthlyLabel: monthly.monthLabel,
      myMonthlyRank: monthly.myMonthlyRank,
    };
  }

  const myCode = await ensureReferralCodeForUser(actor.user.id);
  const referrals = await prisma.referral.findMany({
    where: { referrerUserId: actor.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      referred: {
        select: {
          alias: true,
          email: true,
        },
      },
    },
  });

  const creditedCount = referrals.filter((entry) => entry.status === "CREDITED").length;
  const pendingCount = referrals.filter((entry) => entry.status === "PENDING").length;
  const totalEarnedCredits = referrals
    .filter((entry) => entry.status === "CREDITED")
    .reduce((sum, entry) => sum + Number(entry.referrerRewardCredits ?? 0), 0);

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
    monthlyLeaderboard: monthly.leaderboard,
    monthlyLabel: monthly.monthLabel,
    myMonthlyRank: monthly.myMonthlyRank,
  };
}
