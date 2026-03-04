import { prisma } from "@/lib/db";

/**
 * CREDIT MODEL (MVP):
 * - LedgerTx.amount is positive for grants, negative for spends.
 * - Balance = SUM(amount) for the user.
 * - Types are informational (useful for rules/reporting).
 */

export async function getCreditBalance(userId: string) {
  const rows = await prisma.ledgerTx.findMany({
    where: { userId },
    select: { amount: true },
  });
  return rows.reduce((sum, r) => sum + (r.amount ?? 0), 0);
}

export async function grantCredits(userId: string, amount: number, memo?: string, type = "CREDIT_GRANT") {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("grantCredits: amount must be > 0");
  await prisma.ledgerTx.create({
    data: {
      userId,
      type,
      amount: Math.floor(amount),
      memo: memo ?? null,
    },
  });
}

export async function spendCredits(userId: string, amount: number, memo?: string, type = "ATTEMPT_SPEND") {
  const spend = Math.floor(amount);
  if (!Number.isFinite(spend) || spend <= 0) throw new Error("spendCredits: amount must be > 0");

  const balance = await getCreditBalance(userId);
  if (balance < spend) throw new Error("insufficient_credits");

  await prisma.ledgerTx.create({
    data: {
      userId,
      type,
      amount: -spend,
      memo: memo ?? null,
    },
  });

  return { ok: true, balanceAfter: balance - spend };
}

/**
 * DAILY GRANT (idempotent):
 * Gives the user a fixed number of credits once per day.
 * This is safe to call from multiple pages without duplicating credits.
 */
export async function ensureDailyCredits(userId: string, dayKey: string, amount = 30) {
  const memo = `daily:${dayKey}`;

  const existing = await prisma.ledgerTx.findFirst({
    where: { userId, type: "DAILY_GRANT", memo },
    select: { id: true },
  });

  if (!existing) {
    await prisma.ledgerTx.create({
      data: {
        userId,
        type: "DAILY_GRANT",
        amount,
        memo,
      },
    });
  }
}
