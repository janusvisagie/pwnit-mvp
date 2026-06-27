// src/lib/subscriptions.ts
// Phase 1 (no billing): credit-pack subscriptions. Each cycle grants PAID credits to the wallet,
// logged in CreditLedger. "Credit-pack" means these behave exactly like purchased credits: spent
// on plays they earn the 1:1 voucher discount and count toward activation (paidCreditsCollected).
// Real recurring billing is Phase 2 (gate createSubscription / grant on a confirmed payment).

import { prisma } from "@/lib/db";
import { logCreditTx } from "@/lib/ledger";

export function subscriptionPlan() {
  return {
    planKey: "standard",
    feeZAR: Number(process.env.PWNIT2_SUB_FEE_ZAR ?? "30"),
    creditsPerCycle: Number(process.env.PWNIT2_SUB_CREDITS ?? "40"),
    cycleDays: Number(process.env.PWNIT2_SUB_CYCLE_DAYS ?? "30"),
  };
}

export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
}

export async function createSubscription(userId: string) {
  const existing = await getActiveSubscription(userId);
  if (existing) return existing;
  const plan = subscriptionPlan();
  const now = new Date();
  return prisma.subscription.create({
    data: {
      userId,
      planKey: plan.planKey,
      status: "ACTIVE",
      feeZAR: plan.feeZAR,
      creditsPerCycle: plan.creditsPerCycle,
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + plan.cycleDays * 86_400_000),
    },
  });
}

export async function cancelSubscription(userId: string) {
  const sub = await getActiveSubscription(userId);
  if (!sub) return { ok: true as const };
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  return { ok: true as const };
}

/**
 * Grant one cycle of paid credits for a subscription and advance the period.
 * Phase 1: callable by an admin with { force: true } for testing.
 * Phase 2: called by the billing webhook AFTER a successful recurring charge.
 */
export async function grantSubscriptionCycle(subscriptionId: string, opts: { force?: boolean } = {}) {
  return prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) throw new Error("subscription_not_found");
    if (sub.status !== "ACTIVE") throw new Error("subscription_not_active");
    const now = new Date();
    if (!opts.force && sub.lastGrantedAt && now < sub.currentPeriodEnd) {
      throw new Error("cycle_not_due");
    }
    const u = await tx.user.update({
      where: { id: sub.userId },
      data: { paidCreditsBalance: { increment: sub.creditsPerCycle } },
      select: { freeCreditsBalance: true, paidCreditsBalance: true },
    });
    await logCreditTx(tx, {
      userId: sub.userId,
      kind: "SUBSCRIPTION_GRANT",
      credits: sub.creditsPerCycle,
      balanceAfter: Number(u.freeCreditsBalance ?? 0) + Number(u.paidCreditsBalance ?? 0),
      source: "SUBSCRIPTION",
      reference: sub.id,
      note: `Subscription cycle credits (+${sub.creditsPerCycle})`,
    });
    const cycleDays = Number(process.env.PWNIT2_SUB_CYCLE_DAYS ?? "30");
    await tx.subscription.update({
      where: { id: sub.id },
      data: {
        lastGrantedAt: now,
        grantsCount: { increment: 1 },
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + cycleDays * 86_400_000),
      },
    });
    return { ok: true as const, granted: sub.creditsPerCycle, userId: sub.userId };
  });
}
