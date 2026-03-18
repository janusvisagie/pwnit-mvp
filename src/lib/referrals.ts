import { randomBytes } from "crypto";

import { cookies, headers } from "next/headers";

import { getCurrentActor } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const REFERRAL_COOKIE = "pwnit_referral";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
export const REFERRAL_REFERRER_BONUS = 20;
export const REFERRAL_REFRIEND_BONUS = 10;

const REFERRAL_CODE_RE = /^[A-Z0-9]{6,12}$/;

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

    await tx.user.update({
      where: { id: referral.referrerUserId },
      data: {
        freeCreditsBalance: { increment: referral.referrerRewardCredits },
      },
    });

    await tx.user.update({
      where: { id: referredUserId },
      data: {
        freeCreditsBalance: { increment: referral.referredRewardCredits },
      },
    });

    await tx.creditLedger.createMany({
      data: [
        {
          userId: referral.referrerUserId,
          kind: "REFERRAL_BONUS",
          credits: referral.referrerRewardCredits,
          note: "Referral reward after your friend completed their first real play.",
        },
        {
          userId: referredUserId,
          kind: "REFERRED_WELCOME",
          credits: referral.referredRewardCredits,
          note: "Welcome bonus for joining with a referral and completing your first real play.",
        },
      ],
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

        await tx.user.update({
          where: { id: referrer.id },
          data: {
            freeCreditsBalance: { increment: REFERRAL_REFERRER_BONUS },
          },
        });

        await tx.user.update({
          where: { id: actor.user.id },
          data: {
            freeCreditsBalance: { increment: REFERRAL_REFRIEND_BONUS },
          },
        });

        await tx.creditLedger.createMany({
          data: [
            {
              userId: referrer.id,
              kind: "REFERRAL_BONUS",
              credits: REFERRAL_REFERRER_BONUS,
              note: "Referral reward after your friend completed their first real play.",
            },
            {
              userId: actor.user.id,
              kind: "REFERRED_WELCOME",
              credits: REFERRAL_REFRIEND_BONUS,
              note: "Welcome bonus for joining with a referral and completing your first real play.",
            },
          ],
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

  const siteUrl =
    process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
  };
}
