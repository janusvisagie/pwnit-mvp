import { prisma } from "@/lib/db";
import { logCreditTx, type Tx } from "@/lib/ledger";

/**
 * CREDIT MODEL (current schema):
 * - freeCreditsBalance and paidCreditsBalance are stored directly on User.
 * - Daily free credits top up the free balance once per day (see auth.ts).
 * - spendCredits consumes free balance first, then paid balance.
 *
 * AUDIT RULE: no balance change without a CreditLedger row in the SAME transaction.
 */

export async function getCreditBalance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { freeCreditsBalance: true, paidCreditsBalance: true },
  });

  return (user?.freeCreditsBalance ?? 0) + (user?.paidCreditsBalance ?? 0);
}

export async function grantCredits(userId: string, amount: number, memo?: string, type = "CREDIT_GRANT") {
  const grant = Math.floor(amount);
  if (!Number.isFinite(grant) || grant <= 0) {
    throw new Error("grantCredits: amount must be > 0");
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { paidCreditsBalance: { increment: grant } },
      select: { freeCreditsBalance: true, paidCreditsBalance: true },
    });

    await logCreditTx(tx, {
      userId,
      kind: type,
      credits: grant,
      balanceAfter: Number(updated.freeCreditsBalance ?? 0) + Number(updated.paidCreditsBalance ?? 0),
      note: memo ?? null,
    });
  });
}

export type SpendInfo = {
  itemId?: string | null;
  roundId?: string | null;
  attemptId?: string | null;
  source?: string | null;
  note?: string | null;
  kind?: string; // defaults to CREDIT_SPEND_ATTEMPT
};

/**
 * Spend credits INSIDE an existing transaction (free first, then paid) and write the
 * ledger row atomically. Throws "insufficient_credits" if the balance is too low.
 */
export async function spendCreditsInTx(tx: Tx, userId: string, amount: number, info: SpendInfo = {}) {
  const spend = Math.floor(amount);
  if (!Number.isFinite(spend) || spend <= 0) {
    throw new Error("spendCredits: amount must be > 0");
  }

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
  const balanceAfter = balance - spend;

  await tx.user.update({
    where: { id: userId },
    data: {
      freeCreditsBalance: { decrement: freeUsed },
      paidCreditsBalance: { decrement: paidUsed },
    },
  });

  await logCreditTx(tx, {
    userId,
    kind: info.kind ?? "CREDIT_SPEND_ATTEMPT",
    credits: -spend,
    balanceAfter,
    itemId: info.itemId ?? null,
    roundId: info.roundId ?? null,
    attemptId: info.attemptId ?? null,
    source: info.source ?? null,
    note: info.note ?? null,
  });

  return { ok: true as const, balanceAfter, freeUsed, paidUsed };
}

/** Back-compatible wrapper: spends in its own transaction (now ledger-backed). */
export async function spendCredits(userId: string, amount: number, memo?: string, _type = "ATTEMPT_SPEND") {
  return prisma.$transaction(async (tx) =>
    spendCreditsInTx(tx, userId, amount, { source: memo ?? null, note: memo ?? null }),
  );
}

/**
 * DAILY GRANT (idempotent, legacy helper — the live top-up is in auth.ts):
 * Gives the user a fixed number of free credits once per day.
 */
export async function ensureDailyCredits(userId: string, dayKey: string, amount = 5) {
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

    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        freeCreditsBalance: { increment: grant },
        lastDailyCreditsDayKey: dayKey,
      },
      select: { freeCreditsBalance: true, paidCreditsBalance: true },
    });

    await logCreditTx(tx, {
      userId,
      kind: "DAILY_FREE",
      credits: grant,
      balanceAfter: Number(updated.freeCreditsBalance ?? 0) + Number(updated.paidCreditsBalance ?? 0),
      source: "DAILY_TOPUP",
      note: `Daily free credits for ${dayKey}`,
    });
  });
}
