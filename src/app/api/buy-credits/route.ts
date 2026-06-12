export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireVerifiedAccount } from "@/lib/auth";
import { logCreditTx } from "@/lib/ledger";

// Legacy top-up endpoint (PwnIt 1 era). Currently has no UI callers — the credits page
// uses /api/credits/buy — but it is kept functional and now ledger-compliant so no
// balance-mutating path exists without an audit row.
const TOPUP = 30;

export async function POST() {
  const auth = await requireVerifiedAccount();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: user.id },
      data: { paidCreditsBalance: { increment: TOPUP } },
      select: { paidCreditsBalance: true, freeCreditsBalance: true },
    });
    await logCreditTx(tx, {
      userId: user.id,
      kind: "PAID_CREDIT_PURCHASE",
      credits: TOPUP,
      balanceAfter: Number(u.freeCreditsBalance ?? 0) + Number(u.paidCreditsBalance ?? 0),
      source: "LEGACY_BUY_CREDITS",
      reference: `legacy-${Date.now().toString(36)}`,
      note: "Legacy top-up endpoint (+30)",
    });
    return u;
  });

  return NextResponse.json({
    ok: true,
    added: TOPUP,
    paidCreditsBalance: Number(updated.paidCreditsBalance ?? 0),
    freeCreditsBalance: Number(updated.freeCreditsBalance ?? 0),
  });
}
