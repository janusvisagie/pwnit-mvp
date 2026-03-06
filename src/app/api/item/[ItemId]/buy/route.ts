export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { buyPriceAfterSpend, tierLabel } from "@/lib/pricing";

function getParamItemId(params: any) {
  const raw = params?.ItemId ?? params?.itemId ?? params?.id ?? "";
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
  if (iWon) return { ok: false as const, status: 400, error: "You won this prize — no need to buy." };

  const agg = await prisma.attempt.aggregate({
    where: { itemId, userId: me.id },
    _sum: { paidUsed: true },
  });
  const spentCredits = Number(agg._sum.paidUsed ?? 0);

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
  const walletAppliedCredits = Math.min(price.payCredits, paidBal);
  const topUpCredits = Math.max(0, price.payCredits - walletAppliedCredits);

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
    walletAppliedCredits,
    topUpCredits,
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
    amountDueCredits: q.price.payCredits,
    walletAppliedCredits: q.walletAppliedCredits,
    topUpCredits: q.topUpCredits,
    balances: q.balances,
  });
}

export async function POST(req: Request, ctx: { params: any }) {
  try {
    const itemId = getParamItemId(ctx?.params);
    if (!itemId) return NextResponse.json({ ok: false, error: "Missing itemId" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const mode = body?.mode === "full" ? "full" : "mix";

    const q = await buildQuote(itemId);
    if (!q.ok) return NextResponse.json({ ok: false, error: q.error }, { status: q.status });

    const result = await prisma.$transaction(async (tx) => {
      const fresh = await tx.user.findUnique({ where: { id: q.me.id } });
      const paidBal = Number(fresh?.paidCreditsBalance ?? 0);

      const walletAppliedCredits = mode === "mix" ? Math.min(q.price.payCredits, paidBal) : 0;
      const topUpCredits = Math.max(0, q.price.payCredits - walletAppliedCredits);

      if (walletAppliedCredits > 0) {
        await tx.user.update({
          where: { id: q.me.id },
          data: { paidCreditsBalance: paidBal - walletAppliedCredits },
        });
      }

      await tx.itemPurchase.create({
        data: {
          itemId,
          userId: q.me.id,
          dayKey: new Date().toISOString().slice(0, 10),
          priceCredits: q.price.priceCredits,
          spentCredits: q.price.spentCredits,
          discountPct: q.price.discountPct,
          discountCredits: q.price.appliedDiscount,
          payCredits: q.price.payCredits,
          tierKey: mode === "full" ? `${q.price.tierKey}_FULLPAY` : q.price.tierKey,
        } as any,
      });

      return {
        ok: true as const,
        newBalance: paidBal - walletAppliedCredits,
        walletAppliedCredits,
        topUpCredits,
      };
    });

    return NextResponse.json({
      ok: true,
      mode,
      tier: tierLabel(q.price.tierKey),
      discountPct: q.price.discountPct,
      priceCredits: q.price.priceCredits,
      spentCredits: q.price.spentCredits,
      discountAppliedCredits: q.price.appliedDiscount,
      amountDueCredits: q.price.payCredits,
      walletAppliedCredits: result.walletAppliedCredits,
      topUpCredits: result.topUpCredits,
      newBalance: result.newBalance,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
