// Legacy convenience route kept for compatibility.
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { buyPriceAfterSpend, tierLabel } from "@/lib/pricing";
import { ensureCurrentRound, syncRoundLifecycle } from "@/lib/rounds";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const itemId = String(body?.itemId || "").trim();
    if (!itemId) return NextResponse.json({ ok: false, error: "Missing itemId" }, { status: 400 });

    const me = await getOrCreateDemoUser();
    await syncRoundLifecycle(itemId);

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ ok: false, error: "Item not found" }, { status: 404 });

    const round = await ensureCurrentRound(itemId);
    if (!round) return NextResponse.json({ ok: false, error: "Round not found" }, { status: 404 });

    const iWon = await prisma.winner.findFirst({ where: { roundId: round.id, userId: me.id, rank: 1, rewardType: "ITEM" } });
    if (iWon) return NextResponse.json({ ok: false, error: "You won this prize — no need to buy." }, { status: 400 });

    const agg = await prisma.attempt.aggregate({ where: { itemId, roundId: round.id, userId: me.id }, _sum: { paidUsed: true } });
    const fresh = await prisma.user.findUnique({ where: { id: me.id }, select: { paidCreditsBalance: true } });

    const price = buyPriceAfterSpend({
      prizeValueZAR: item.prizeValueZAR,
      tierNumber: item.tier,
      spentCredits: Number(agg._sum.paidUsed ?? 0),
      walletCredits: Number(fresh?.paidCreditsBalance ?? 0),
    });

    return NextResponse.json({
      ok: true,
      tier: tierLabel(price.tierKey),
      priceCredits: price.priceCredits,
      playDiscountCredits: price.playDiscountCredits,
      newPriceCredits: price.newPriceCredits,
      walletAppliedCredits: price.walletAppliedCredits,
      topUpCredits: price.topUpCredits,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
