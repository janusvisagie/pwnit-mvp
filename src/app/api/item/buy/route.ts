// src/app/api/item/buy/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
import { getOrCreateDemoUser } from "@/lib/auth";
import { buyPriceAfterSpend, tierLabel } from "@/lib/pricing";

/**
 * "Buy if you didn't win" for the current item.
 *
 * ✅ Discount uses *paid credits actually spent* playing this item (money you spent),
 *   not freebies. This is why we sum Attempt.paidUsed.
 *
 * ✅ Requires precise Attempt fields:
 *   - costCredits, freeUsed, paidUsed
 *
 * If you haven't run `npx prisma db push` after adding those fields,
 * this route will still work but will treat spentPaidCredits as 0.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const itemId = String(body?.itemId || "").trim();
    if (!itemId) return NextResponse.json({ ok: false, error: "Missing itemId" }, { status: 400 });

    const me = await getOrCreateDemoUser();
    const dayKey = dayKeyZA();

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ ok: false, error: "Item not found" }, { status: 404 });

    // Only allow buy after settled (closed/published or countdown over)
    const now = new Date();
    const countdownOver = item.closesAt ? now > item.closesAt : false;
    const settled = item.state === "PUBLISHED" || item.state === "CLOSED" || countdownOver;
    if (!settled) {
      return NextResponse.json({ ok: false, error: "Not available to buy yet" }, { status: 400 });
    }

    // Winners can't buy
    const iWon = await prisma.winner.findFirst({
      where: { itemId, dayKey, userId: me.id },
      select: { id: true },
    });
    if (iWon) return NextResponse.json({ ok: false, error: "You’re a winner — no need to buy." }, { status: 400 });

    // ✅ Precise "money spent" = sum of paidUsed for this user on this item (all time)
    // (We intentionally do NOT limit to dayKey here.)
    let spentPaidCredits = 0;
    let spentTotalCredits = 0;

    try {
      const agg = await prisma.attempt.aggregate({
        where: { itemId, userId: me.id },
        _sum: { paidUsed: true, costCredits: true },
      });

      spentPaidCredits = Number((agg as any)?._sum?.paidUsed ?? 0);
      spentTotalCredits = Number((agg as any)?._sum?.costCredits ?? 0);
    } catch {
      // If schema wasn't pushed yet, Prisma will throw (unknown field). Treat as 0.
      spentPaidCredits = 0;
      spentTotalCredits = 0;
    }

    const price = buyPriceAfterSpend({
      prizeValueZAR: item.prizeValueZAR,
      tierNumber: item.tier,
      spentCredits: spentPaidCredits,
    });

    const result = await prisma.$transaction(async (tx) => {
      const fresh: any = await tx.user.findUnique({
        where: { id: me.id },
        select: { id: true, paidCreditsBalance: true },
      });

      const paidBal = Number(fresh?.paidCreditsBalance ?? 0);

      if (paidBal < price.payCredits) {
        return { ok: false as const, paidBal, need: price.payCredits - paidBal };
      }

      await tx.user.update({
        where: { id: me.id },
        data: { paidCreditsBalance: paidBal - price.payCredits } as any,
      });

      await tx.itemPurchase.create({
        data: {
          itemId,
          userId: me.id,
          dayKey,

          priceCredits: price.priceCredits,
          spentCredits: price.spentCredits,
          discountPct: price.discountPct,
          discountCredits: price.appliedDiscount,
          payCredits: price.payCredits,
          tierKey: price.tierKey,
        } as any,
      });

      return { ok: true as const, newBalance: paidBal - price.payCredits };
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Not enough paid credits to buy this item.",
          payCredits: price.payCredits,
          paidBalance: result.paidBal,
          needCredits: result.need,
        },
        { status: 402 }
      );
    }

    return NextResponse.json({
      ok: true,

      tier: tierLabel(price.tierKey),
      discountPct: price.discountPct,

      priceCredits: price.priceCredits,
      spentPaidCredits: price.spentCredits,
      spentTotalCredits,
      discountAppliedCredits: price.appliedDiscount,
      payCredits: price.payCredits,

      newBalance: result.newBalance,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}