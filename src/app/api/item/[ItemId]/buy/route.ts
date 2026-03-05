// src/app/api/item/[ItemId]/buy/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
import { getOrCreateDemoUser } from "@/lib/auth";
import { tierLabel } from "@/lib/pricing";

/**
 * Buy Now pricing rule (MVP):
 * - Item price is its prizeValueZAR (1 credit = R1 for now).
 * - Voucher/discount is 50% of the PAID credits you spent playing (today, on this item).
 * - Amount due = max(0, itemPrice - voucher)
 *
 * GET  -> return a quote (no deduction)
 * POST -> perform the purchase (deduct paid credits + record purchase)
 */
function getParamItemId(params: any) {
  // Accept either /api/item/[itemId]/buy or /api/item/[id]/buy
  // Also accept the legacy folder casing: [ItemId]
  const raw = params?.itemId ?? params?.ItemId ?? params?.id ?? "";
  return String(raw || "").trim();
}

async function buildQuote(itemId: string) {
  const me = await getOrCreateDemoUser();
  const dayKey = dayKeyZA();

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false as const, status: 404, error: "Item not found" };

  const iWon = await prisma.winner.findFirst({
    where: { itemId, dayKey, userId: me.id },
    select: { id: true },
  });
  if (iWon) return { ok: false as const, status: 400, error: "You’re a winner — no need to buy." };

  const alreadyBought = await prisma.itemPurchase.findFirst({
    where: { itemId, dayKey, userId: me.id },
    select: { id: true },
  });
  if (alreadyBought) return { ok: false as const, status: 400, error: "Already purchased." };

  const spentAgg = await prisma.attempt.aggregate({
    where: { itemId, dayKey, userId: me.id },
    _sum: { costCredits: true, paidUsed: true, freeUsed: true },
  });

  const spentCredits = Number(spentAgg._sum.costCredits ?? 0);
  const spentPaidCredits = Number(spentAgg._sum.paidUsed ?? 0);
  const spentFreeCredits = Number(spentAgg._sum.freeUsed ?? 0);

  const itemPriceCredits = Number(item.prizeValueZAR ?? 0);
  const voucherCredits = Math.max(0, Math.floor(spentPaidCredits * 0.5));
  const amountDueCredits = Math.max(0, itemPriceCredits - voucherCredits);

  const fresh = await prisma.user.findUnique({
    where: { id: me.id },
    select: { paidCreditsBalance: true, freeCreditsBalance: true },
  });
  const paidBal = Number(fresh?.paidCreditsBalance ?? 0);
  const freeBal = Number((fresh as any)?.freeCreditsBalance ?? 0);

  const outstandingPaidNeeded = Math.max(0, amountDueCredits - paidBal);
  const discountPct = itemPriceCredits > 0 ? Math.min(100, Math.round((voucherCredits / itemPriceCredits) * 100)) : 0;

  return {
    ok: true as const,
    status: 200,
    item,
    me,
    dayKey,
    pricing: {
      tierKey: `T${item.tier}`,
      itemPriceCredits,
      spentCredits,
      spentPaidCredits,
      spentFreeCredits,
      voucherCredits,
      amountDueCredits,
      outstandingPaidNeeded,
      discountPct,
    },
    balances: { paid: paidBal, free: freeBal, total: paidBal + freeBal },
  };
}

export async function GET(_: Request, ctx: { params: any }) {
  const itemId = getParamItemId(ctx?.params);
  if (!itemId) return NextResponse.json({ ok: false, error: "Missing itemId" }, { status: 400 });

  const q = await buildQuote(itemId);
  if (!q.ok) return NextResponse.json({ ok: false, error: q.error }, { status: q.status });

  return NextResponse.json({
    ok: true,
    tier: tierLabel(q.pricing.tierKey as any),
    priceCredits: q.pricing.itemPriceCredits,
    spentCredits: q.pricing.spentCredits,
    spentPaidCredits: q.pricing.spentPaidCredits,
    voucherCredits: q.pricing.voucherCredits,
    discountAppliedCredits: q.pricing.voucherCredits,
    discountPct: q.pricing.discountPct,
    payCredits: q.pricing.amountDueCredits,
    amountDueCredits: q.pricing.amountDueCredits,
    outstandingPaidNeeded: q.pricing.outstandingPaidNeeded,
    balances: q.balances,
  });
}

export async function POST(_: Request, ctx: { params: any }) {
  try {
    const itemId = getParamItemId(ctx?.params);
    if (!itemId) return NextResponse.json({ ok: false, error: "Missing itemId" }, { status: 400 });

    const q = await buildQuote(itemId);
    if (!q.ok) return NextResponse.json({ ok: false, error: q.error }, { status: q.status });

    const result = await prisma.$transaction(async (tx) => {
      const fresh = await tx.user.findUnique({ where: { id: q.me.id } });
      const paidBal = Number(fresh?.paidCreditsBalance ?? 0);

      if (paidBal < q.pricing.amountDueCredits) {
        return {
          ok: false as const,
          error: "Not enough paid credits",
          outstandingPaidNeeded: Math.max(0, q.pricing.amountDueCredits - paidBal),
        };
      }

      // Re-check purchase inside the tx to avoid races
      const alreadyBought = await tx.itemPurchase.findFirst({
        where: { itemId, dayKey: q.dayKey, userId: q.me.id },
        select: { id: true },
      });
      if (alreadyBought) return { ok: false as const, error: "Already purchased." };

      await tx.user.update({
        where: { id: q.me.id },
        data: { paidCreditsBalance: paidBal - q.pricing.amountDueCredits },
      });

      await tx.itemPurchase.create({
        data: {
          itemId,
          userId: q.me.id,
          dayKey: q.dayKey,
          priceCredits: q.pricing.itemPriceCredits,
          spentCredits: q.pricing.spentCredits,
          discountPct: q.pricing.discountPct,
          discountCredits: q.pricing.voucherCredits,
          payCredits: q.pricing.amountDueCredits,
          tierKey: q.pricing.tierKey,
        } as any,
      });

      return { ok: true as const, newBalance: paidBal - q.pricing.amountDueCredits };
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          outstandingPaidNeeded: (result as any).outstandingPaidNeeded ?? q.pricing.outstandingPaidNeeded,
          priceCredits: q.pricing.itemPriceCredits,
          voucherCredits: q.pricing.voucherCredits,
          payCredits: q.pricing.amountDueCredits,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      tier: tierLabel(q.pricing.tierKey as any),
      priceCredits: q.pricing.itemPriceCredits,
      spentCredits: q.pricing.spentCredits,
      spentPaidCredits: q.pricing.spentPaidCredits,
      voucherCredits: q.pricing.voucherCredits,
      discountAppliedCredits: q.pricing.voucherCredits,
      discountPct: q.pricing.discountPct,
      payCredits: q.pricing.amountDueCredits,
      amountDueCredits: q.pricing.amountDueCredits,
      newBalance: result.newBalance,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
