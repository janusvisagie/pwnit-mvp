export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { buyPriceAfterSpend } from "@/lib/pricing";

function getParamItemId(params: any) {
  const raw = params?.itemId ?? params?.ItemId ?? params?.id ?? "";
  return String(raw || "").trim();
}

async function buildQuote(itemId: string) {
  const me = await getOrCreateDemoUser();

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false as const, status: 404, error: "Item not found" };

  const iWon = await prisma.winner.findFirst({
    where: { itemId, userId: me.id },
    select: { id: true },
  });
  if (iWon) return { ok: false as const, status: 400, error: "You won this item — no need to buy." };

  const agg = await prisma.attempt.aggregate({
    where: { itemId, userId: me.id },
    _sum: { paidUsed: true },
  });
  const spentPaidCredits = Number(agg._sum.paidUsed ?? 0);

  const price = buyPriceAfterSpend({
    prizeValueZAR: item.prizeValueZAR,
    spentPaidCredits,
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
    price,
    balances: {
      paid: paidBal,
      free: freeBal,
      total: paidBal + freeBal,
    },
  };
}

export async function GET(_: Request, ctx: { params: any }) {
  const itemId = getParamItemId(ctx?.params);
  if (!itemId) return NextResponse.json({ ok: false, error: "Missing itemId" }, { status: 400 });

  const q = await buildQuote(itemId);
  if (!q.ok) return NextResponse.json({ ok: false, error: q.error }, { status: q.status });

  return NextResponse.json({
    ok: true,
    priceCredits: q.price.priceCredits,
    spentPaidCredits: q.price.spentPaidCredits,
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
      const paidBal = Number(fresh?.paidCreditsBalance ?? 0);

      if (paidBal < q.price.payCredits) {
        return { ok: false as const, error: `Not enough paid credits. You still need R${q.price.payCredits}.` };
      }

      await tx.user.update({
        where: { id: q.me.id },
        data: { paidCreditsBalance: paidBal - q.price.payCredits },
      });

      await tx.itemPurchase.create({
        data: {
          itemId,
          userId: q.me.id,
          dayKey: new Date().toISOString().slice(0, 10),
          priceCredits: q.price.priceCredits,
          spentCredits: q.price.spentPaidCredits,
          discountPct: 100,
          discountCredits: q.price.appliedDiscount,
          payCredits: q.price.payCredits,
          tierKey: "DIRECT_BUY",
        } as any,
      });

      return { ok: true as const, newBalance: paidBal - q.price.payCredits };
    });

    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

    return NextResponse.json({
      ok: true,
      priceCredits: q.price.priceCredits,
      spentPaidCredits: q.price.spentPaidCredits,
      discountAppliedCredits: q.price.appliedDiscount,
      payCredits: q.price.payCredits,
      newBalance: result.newBalance,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
