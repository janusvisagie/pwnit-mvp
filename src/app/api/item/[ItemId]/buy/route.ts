// src/app/api/item/[ItemId]/buy/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
import { getOrCreateDemoUser } from "@/lib/auth";
import { buyPriceAfterSpend, tierLabel } from "@/lib/pricing";

/**
 * GET -> return a pricing quote (no deduction)
 * POST -> perform the purchase (deduct paid credits + record purchase)
 */
function getParamItemId(params: any) {
  // ✅ accept either /api/item/[itemId]/buy or /api/item/[id]/buy
  // Also accept the legacy folder casing: [ItemId]
  const raw = params?.itemId ?? params?.ItemId ?? params?.id ?? "";
  return String(raw || "").trim();
}

async function buildQuote(itemId: string) {
  const me = await getOrCreateDemoUser();
  const dayKey = dayKeyZA();

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false as const, status: 404, error: "Item not found" };

  const now = new Date();
  const countdownOver = item.closesAt ? now > item.closesAt : false;
  const settled = item.state === "PUBLISHED" || item.state === "CLOSED" || countdownOver;

  if (!settled) return { ok: false as const, status: 400, error: "Not available to buy yet" };

  const iWon = await prisma.winner.findFirst({
    where: { itemId, dayKey, userId: me.id },
    select: { id: true },
  });
  if (iWon) return { ok: false as const, status: 400, error: "You’re a winner — no need to buy." };

  const agg = await prisma.attempt.aggregate({
    where: { itemId, dayKey, userId: me.id },
    _sum: { costCredits: true },
  });
  const spentCredits = Number(agg._sum.costCredits ?? 0);

  const price = buyPriceAfterSpend({
    prizeValueZAR: item.prizeValueZAR,
    tierNumber: item.tier,
    spentCredits,
  });

  const fresh = await prisma.user.findUnique({
    where: { id: me.id },
    select: { paidCreditsBalance: true, freeCreditsBalance: true },
  });
  const paidBal = Number(fresh?.paidCreditsBalance ?? 0);
  const freeBal = Number((fresh as any)?.freeCreditsBalance ?? 0);

  return {
    ok: true as const,
    status: 200,
    item,
    me,
    dayKey,
    price,
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
    tier: tierLabel(q.price.tierKey),
    discountPct: q.price.discountPct,
    priceCredits: q.price.priceCredits,
    spentCredits: q.price.spentCredits,
    discountAppliedCredits: q.price.appliedDiscount,
    payCredits: q.price.payCredits,
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
      const bal = Number(fresh?.paidCreditsBalance ?? 0);

      if (bal < q.price.payCredits) return { ok: false as const, error: "Not enough paid credits" };

      await tx.user.update({
        where: { id: q.me.id },
        data: { paidCreditsBalance: bal - q.price.payCredits },
      });

      await tx.itemPurchase.create({
        data: {
          itemId,
          userId: q.me.id,
          dayKey: q.dayKey,
          priceCredits: q.price.priceCredits,
          spentCredits: q.price.spentCredits,
          discountPct: q.price.discountPct,
          discountCredits: q.price.appliedDiscount,
          payCredits: q.price.payCredits,
          tierKey: q.price.tierKey,
        } as any,
      });

      return { ok: true as const, newBalance: bal - q.price.payCredits };
    });

    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

    return NextResponse.json({
      ok: true,
      tier: tierLabel(q.price.tierKey),
      discountPct: q.price.discountPct,
      priceCredits: q.price.priceCredits,
      spentCredits: q.price.spentCredits,
      discountAppliedCredits: q.price.appliedDiscount,
      payCredits: q.price.payCredits,
      newBalance: result.newBalance,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
