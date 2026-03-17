export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireVerifiedAccount } from "@/lib/auth";

const TOPUP = 30;

export async function POST() {
  const auth = await requireVerifiedAccount();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { paidCreditsBalance: Number(user.paidCreditsBalance ?? 0) + TOPUP } as any,
    select: { paidCreditsBalance: true, freeCreditsBalance: true },
  });

  return NextResponse.json({
    ok: true,
    added: TOPUP,
    paidCreditsBalance: Number((updated as any).paidCreditsBalance ?? 0),
    freeCreditsBalance: Number((updated as any).freeCreditsBalance ?? 0),
  });
}
