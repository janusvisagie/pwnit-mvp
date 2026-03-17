export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { requireVerifiedAccount } from "@/lib/auth";
import { prisma } from "@/lib/db";

function clampInt(n: unknown, lo: number, hi: number) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return lo;
  return Math.max(lo, Math.min(hi, x));
}

export async function POST(req: Request) {
  try {
    const auth = await requireVerifiedAccount();
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = await req.json().catch(() => ({}));
    const bundleKey = String((body as { bundleKey?: unknown })?.bundleKey || "").trim();
    const exactCredits = (body as { exactCredits?: unknown })?.exactCredits;

    let creditsToAdd = 0;
    if (bundleKey) {
      if (bundleKey === "small") creditsToAdd = 10;
      else if (bundleKey === "medium") creditsToAdd = 25;
      else if (bundleKey === "large") creditsToAdd = 60;
      else return NextResponse.json({ ok: false, error: "Unknown bundleKey" }, { status: 400 });
    } else {
      creditsToAdd = clampInt(exactCredits, 1, 500);
    }

    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        paidCreditsBalance: Number(auth.user.paidCreditsBalance ?? 0) + creditsToAdd,
      } as any,
      select: {
        paidCreditsBalance: true,
        freeCreditsBalance: true,
      },
    });

    return NextResponse.json({
      ok: true,
      added: creditsToAdd,
      paidCreditsBalance: Number((updated as any).paidCreditsBalance ?? 0),
      freeCreditsBalance: Number((updated as any).freeCreditsBalance ?? 0),
      totalCredits:
        Number((updated as any).paidCreditsBalance ?? 0) + Number((updated as any).freeCreditsBalance ?? 0),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || String(error) },
      { status: 500 },
    );
  }
}
