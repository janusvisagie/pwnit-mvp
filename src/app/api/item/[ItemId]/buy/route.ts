export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getCurrentActor, requireVerifiedAccount } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buyPriceAfterSpend, tierLabel } from "@/lib/pricing";
import {
  buildReferralDiscountQuote,
  consumeReferralDiscountForPurchase,
  getAvailableReferralDiscountZAR,
} from "@/lib/referrals";
import { ensureCurrentRound, syncRoundLifecycle } from "@/lib/rounds";

function getParamItemId(params: any) {
  const raw = params?.ItemId ?? params?.itemId ?? params?.id ?? "";
  return String(raw || "").trim();
}

async function buildQuote(itemId: string) {
  const actor = await getCurrentActor();
  const me = actor.user;
  await syncRoundLifecycle(itemId);

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false as const, status: 404, error: "Item not found" };

  const round = await ensureCurrentRound(itemId);
  if (!round) return { ok: false as const, status: 404, error: "Round not found" };

  const iWon = await prisma.winner.findFirst({
    where: { roundId: round.id, userId: me.id, rank: 1, rewardType: "ITEM" },
    select: { id: true },
  });
  if (iWon) return { ok: false as const, status: 400, error: "You won this prize — no need to buy." };

  const agg = await prisma.attempt.aggregate({
    where: { itemId, roundId: round.id, userId: me.id },
    _sum: { paidUsed: true },
  });

  const fresh = await prisma.user.findUnique({
    where: { id: me.id },
    select: { paidCreditsBalance: true, freeCreditsBalance: true },
  });
  const paidBal = Number(fresh?.paidCreditsBalance ?? 0);
  const freeBal = Number((fresh as any)?.freeCreditsBalance ?? 0);
  const price = buyPriceAfterSpend({
    prizeValueZAR: item.prizeValueZAR,
    tierNumber: item.tier,
    spentCredits: Number(agg._sum.paidUsed ?? 0),
    walletCredits: paidBal,
  });

  const referralDiscountAvailableZAR = actor.isGuest || actor.isDemoUser ? 0 : await getAvailableReferralDiscountZAR(me.id);
  const referralQuote = buildReferralDiscountQuote({
    basePriceCredits: price.newPriceCredits,
    availableReferralDiscountZAR: referralDiscountAvailableZAR,
  });

  return {
    ok: true as const,
    status: 200,
    actor,
    item,
    round,
    me,
    price,
    referralQuote,
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
    isGuest: q.actor.isGuest,
    requiresVerifiedAccount: q.actor.isGuest,
    roundState: q.round.state,
    tier: tierLabel(q.price.tierKey),
    discountPct: q.price.discountPct,
    priceCredits: q.price.priceCredits,
    spentCredits: q.price.spentCredits,
    playDiscountCredits: q.price.playDiscountCredits,
    newPriceCredits: q.price.newPriceCredits,
    referralDiscountAvailableZAR: q.referralQuote.availableReferralDiscountZAR,
    referralDiscountAppliedZAR: q.referralQuote.referralDiscountAppliedZAR,
    finalPayCredits: q.referralQuote.amountDueCredits,
    walletAppliedCredits: q.price.walletAppliedCredits,
    topUpCredits: q.price.topUpCredits,
    balances: q.balances,
  });
}

export async function POST(req: Request, ctx: { params: any }) {
  try {
    const auth = await requireVerifiedAccount();
    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: auth.error, requiresVerifiedAccount: true },
        { status: auth.status },
      );
    }

    const itemId = getParamItemId(ctx?.params);
    if (!itemId) return NextResponse.json({ ok: false, error: "Missing itemId" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const mode = (body as { mode?: string })?.mode === "full" ? "full" : "mix";

    const q = await buildQuote(itemId);
    if (!q.ok) return NextResponse.json({ ok: false, error: q.error }, { status: q.status });
    if (q.actor.isGuest) {
      return NextResponse.json(
        { ok: false, error: "Please sign in with your email to continue.", requiresVerifiedAccount: true },
        { status: 401 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const fresh = await tx.user.findUnique({
        where: { id: q.me.id },
        select: { paidCreditsBalance: true },
      });
      const paidBal = Number(fresh?.paidCreditsBalance ?? 0);

      const referralQuote = await consumeReferralDiscountForPurchase(tx, {
        userId: q.me.id,
        itemId,
        roundId: q.round.id,
        basePriceCredits: q.price.newPriceCredits,
        itemTitle: q.item.title,
      });

      const finalPayCredits = referralQuote.amountDueCredits;
      const walletAppliedCredits = mode === "mix" ? Math.min(finalPayCredits, paidBal) : 0;
      const topUpCredits = Math.max(0, finalPayCredits - walletAppliedCredits);

      if (walletAppliedCredits > 0) {
        await tx.user.update({
          where: { id: q.me.id },
          data: { paidCreditsBalance: paidBal - walletAppliedCredits },
        });
        await tx.creditLedger.create({
          data: {
            userId: q.me.id,
            itemId,
            roundId: q.round.id,
            kind: "BUY_WALLET_APPLY",
            credits: -walletAppliedCredits,
            note: `Wallet credits applied to ${q.item.title}`,
          },
        });
      }

      await tx.itemPurchase.create({
        data: {
          itemId,
          roundId: q.round.id,
          userId: q.me.id,
          dayKey: new Date().toISOString().slice(0, 10),
          priceCredits: q.price.priceCredits,
          spentCredits: q.price.spentCredits,
          discountPct: q.price.discountPct,
          discountCredits: q.price.playDiscountCredits + referralQuote.referralDiscountAppliedZAR,
          payCredits: finalPayCredits,
          tierKey: referralQuote.referralDiscountAppliedZAR > 0 ? `${q.price.tierKey}_REF` : q.price.tierKey,
        } as any,
      });

      return {
        ok: true as const,
        newBalance: paidBal - walletAppliedCredits,
        walletAppliedCredits,
        topUpCredits,
        referralDiscountAppliedZAR: referralQuote.referralDiscountAppliedZAR,
        finalPayCredits,
      };
    });

    return NextResponse.json({
      ok: true,
      mode,
      tier: tierLabel(q.price.tierKey),
      priceCredits: q.price.priceCredits,
      spentCredits: q.price.spentCredits,
      playDiscountCredits: q.price.playDiscountCredits,
      newPriceCredits: q.price.newPriceCredits,
      referralDiscountAppliedZAR: result.referralDiscountAppliedZAR,
      finalPayCredits: result.finalPayCredits,
      walletAppliedCredits: result.walletAppliedCredits,
      topUpCredits: result.topUpCredits,
      newBalance: result.newBalance,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Server error" }, { status: 500 });
  }
}
