import { prisma } from "@/lib/db";

/**
 * CREDIT MODEL (current schema):
 * - freeCreditsBalance and paidCreditsBalance are stored directly on User.
 * - Daily free credits top up the free balance once per day.
 * - spendCredits consumes free balance first, then paid balance.
 */

export async function getCreditBalance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { freeCreditsBalance: true, paidCreditsBalance: true },
  });

  return (user?.freeCreditsBalance ?? 0) + (user?.paidCreditsBalance ?? 0);
}

export async function grantCredits(userId: string, amount: number, _memo?: string, _type = "CREDIT_GRANT") {
  const grant = Math.floor(amount);
  if (!Number.isFinite(grant) || grant <= 0) {
    throw new Error("grantCredits: amount must be > 0");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      paidCreditsBalance: {
        increment: grant,
      },
    },
  });
}

export async function spendCredits(userId: string, amount: number, _memo?: string, _type = "ATTEMPT_SPEND") {
  const spend = Math.floor(amount);
  if (!Number.isFinite(spend) || spend <= 0) {
    throw new Error("spendCredits: amount must be > 0");
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { freeCreditsBalance: true, paidCreditsBalance: true },
    });

    const free = user?.freeCreditsBalance ?? 0;
    const paid = user?.paidCreditsBalance ?? 0;
    const balance = free + paid;

    if (balance < spend) {
      throw new Error("insufficient_credits");
    }

    const freeUsed = Math.min(free, spend);
    const paidUsed = spend - freeUsed;

    await tx.user.update({
      where: { id: userId },
      data: {
        freeCreditsBalance: {
          decrement: freeUsed,
        },
        paidCreditsBalance: {
          decrement: paidUsed,
        },
      },
    });

    return { ok: true, balanceAfter: balance - spend, freeUsed, paidUsed };
  });
}

/**
 * DAILY GRANT (idempotent):
 * Gives the user a fixed number of free credits once per day.
 */
export async function ensureDailyCredits(userId: string, dayKey: string, amount = 30) {
  const grant = Math.floor(amount);
  if (!Number.isFinite(grant) || grant <= 0) {
    throw new Error("ensureDailyCredits: amount must be > 0");
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { lastDailyCreditsDayKey: true },
    });

    if (user?.lastDailyCreditsDayKey === dayKey) {
      return;
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        freeCreditsBalance: {
          increment: grant,
        },
        lastDailyCreditsDayKey: dayKey,
      },
    });
  });
}
