// src/lib/ledger.ts
// Append-only audit helpers for credit and discount movements.
//
// RULE: no credit or discount balance may change without a ledger row, written in the
// SAME transaction as the balance change. Use these inside prisma.$transaction(tx => ...).
//
// CreditLedger sign convention (credits column):
//   positive = credits added to the user, negative = credits removed.
// MOVEMENT kinds (sum of `credits` over these = the user's free+paid balance):
//   DAILY_FREE, PAID_CREDIT_PURCHASE, CREDIT_GRANT, CREDIT_SPEND_ATTEMPT,
//   CREDIT_SPEND_PURCHASE, CREDIT_REFUND, EXPIRY, ADMIN_ADJUSTMENT, MIGRATION_INITIAL_BALANCE
// RECORD-ONLY kinds (informational, EXCLUDED from balance reconstruction):
//   PWNIT2_PURCHASE, PWNIT2_DISCOUNT_EARNED (legacy), PWNIT2_DISCOUNT_REDEEMED (legacy)
//
// DiscountLedger sign convention (amount column, per user per campaign/Item):
//   positive = discount earned/added, negative = discount redeemed/expired/refunded.
//   Sum of `amount` for (userId, itemId, roundId) = remaining discount balance.

import type { Prisma, PrismaClient } from "@prisma/client";

export type Tx = Prisma.TransactionClient | PrismaClient;

export const CREDIT_MOVEMENT_KINDS = [
  "DAILY_FREE",
  "PAID_CREDIT_PURCHASE",
  "CREDIT_GRANT",
  "CREDIT_SPEND_ATTEMPT",
  "CREDIT_SPEND_PURCHASE",
  "CREDIT_REFUND",
  "EXPIRY",
  "ADMIN_ADJUSTMENT",
  "MIGRATION_INITIAL_BALANCE",
  "RUNNER_UP_BONUS",
  "FAILED_ROUND_REFUND",
] as const;

export type CreditLedgerInput = {
  userId: string;
  kind: string;
  credits: number; // signed
  balanceAfter?: number | null;
  itemId?: string | null;
  roundId?: string | null;
  source?: string | null;
  attemptId?: string | null;
  paymentId?: string | null;
  adminUserId?: string | null;
  reference?: string | null;
  note?: string | null;
};

/**
 * Write a CreditLedger row inside the caller's transaction.
 * If balanceAfter is not provided, it is read from the user's current balances
 * (call this AFTER the balance update in the same tx so the snapshot is correct).
 */
export async function logCreditTx(tx: Tx, input: CreditLedgerInput) {
  let balanceAfter = input.balanceAfter;
  if (balanceAfter == null) {
    const u = await tx.user.findUnique({
      where: { id: input.userId },
      select: { freeCreditsBalance: true, paidCreditsBalance: true },
    });
    balanceAfter = Number(u?.freeCreditsBalance ?? 0) + Number(u?.paidCreditsBalance ?? 0);
  }
  return tx.creditLedger.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      credits: Math.trunc(input.credits),
      balanceAfter,
      itemId: input.itemId ?? null,
      roundId: input.roundId ?? null,
      source: input.source ?? null,
      attemptId: input.attemptId ?? null,
      paymentId: input.paymentId ?? null,
      adminUserId: input.adminUserId ?? null,
      reference: input.reference ?? null,
      note: input.note ?? null,
    } as any,
  });
}

export type DiscountLedgerInput = {
  userId: string;
  itemId: string;
  roundId?: string | null;
  type: string; // DISCOUNT_EARNED | DISCOUNT_REDEEMED | DISCOUNT_EXPIRED | DISCOUNT_REFUNDED | ADMIN_ADJUSTMENT | MIGRATION_INITIAL_BALANCE
  amount: number; // signed: + earned, - redeemed/expired
  source?: string | null;
  attemptId?: string | null;
  purchaseId?: string | null;
  adminUserId?: string | null;
  reference?: string | null;
  note?: string | null;
};

/**
 * Write a DiscountLedger row inside the caller's transaction.
 * balanceAfter = (sum of existing rows for this user+campaign) + amount.
 */
export async function logDiscountTx(tx: Tx, input: DiscountLedgerInput) {
  const agg = await (tx as any).discountLedger.aggregate({
    where: { userId: input.userId, itemId: input.itemId, roundId: input.roundId ?? null },
    _sum: { amount: true },
  });
  const prev = Number(agg?._sum?.amount ?? 0);
  const amount = Math.trunc(input.amount);
  return (tx as any).discountLedger.create({
    data: {
      userId: input.userId,
      itemId: input.itemId,
      roundId: input.roundId ?? null,
      type: input.type,
      amount,
      balanceAfter: prev + amount,
      source: input.source ?? null,
      attemptId: input.attemptId ?? null,
      purchaseId: input.purchaseId ?? null,
      adminUserId: input.adminUserId ?? null,
      reference: input.reference ?? null,
      note: input.note ?? null,
    },
  });
}

/** Remaining discount balance for a user on a campaign, reconstructed from the ledger. */
export async function discountBalanceFromLedger(tx: Tx, userId: string, itemId: string, roundId?: string | null) {
  const agg = await (tx as any).discountLedger.aggregate({
    where: { userId, itemId, roundId: roundId ?? null },
    _sum: { amount: true },
  });
  return Number(agg?._sum?.amount ?? 0);
}

/** Credit balance reconstructed from MOVEMENT ledger rows (record-only kinds excluded). */
export async function creditBalanceFromLedger(tx: Tx, userId: string) {
  const agg = await tx.creditLedger.aggregate({
    where: { userId, kind: { in: CREDIT_MOVEMENT_KINDS as unknown as string[] } },
    _sum: { credits: true },
  });
  return Number(agg?._sum?.credits ?? 0);
}
