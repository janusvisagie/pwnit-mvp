export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getCurrentActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logCreditTx } from "@/lib/ledger";

const BUNDLE_CREDITS: Record<string, number> = {
  starter: 30,
  value: 80,
  max: 150,
  // alias: the buy-credits button posts "medium"; map it to the 30-credit starter pack.
  medium: 30,
};

export async function POST(req: Request) {
  try {
    const actor = await getCurrentActor();
    const body = await req.json().catch(() => ({}));
    const bundleKey = String((body as { bundleKey?: unknown })?.bundleKey || "").trim().toLowerCase();
    const creditsToAdd = BUNDLE_CREDITS[bundleKey];

    if (!creditsToAdd) {
      return NextResponse.json({ ok: false, error: "Unknown bundle." }, { status: 400 });
    }

    // Dummy/test purchase: no real payment is taken. When a real gateway lands, credits
    // must only be granted AFTER server-side payment confirmation, with paymentId set.
    const reference = `local-test-${Date.now().toString(36)}`;

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: actor.user.id },
        data: { paidCreditsBalance: { increment: creditsToAdd } },
        select: { freeCreditsBalance: true, paidCreditsBalance: true },
      });

      await logCreditTx(tx, {
        userId: actor.user.id,
        kind: "PAID_CREDIT_PURCHASE",
        credits: creditsToAdd,
        balanceAfter: Number(u.freeCreditsBalance ?? 0) + Number(u.paidCreditsBalance ?? 0),
        source: "DUMMY_BUY_CREDITS",
        reference,
        note: `Test credit bundle "${bundleKey}" (+${creditsToAdd})`,
      });

      return u;
    });

    return NextResponse.json({
      ok: true,
      actorLabel: actor.user.alias || (actor.isGuest ? "Playing as Guest" : actor.user.email),
      added: creditsToAdd,
      reference,
      freeCreditsBalance: Number(updated.freeCreditsBalance ?? 0),
      paidCreditsBalance: Number(updated.paidCreditsBalance ?? 0),
      totalCredits: Number(updated.freeCreditsBalance ?? 0) + Number(updated.paidCreditsBalance ?? 0),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Could not add credits." },
      { status: 500 },
    );
  }
}
