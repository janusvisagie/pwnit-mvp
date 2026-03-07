export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";

function clampInt(n: any, lo: number, hi: number) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return lo;
  return Math.max(lo, Math.min(hi, x));
}

const BUNDLES: Record<string, number> = {
  starter: 60,
  player: 130,
  pro: 350,
  elite: 750,
  small: 60,
  medium: 130,
  large: 350,
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const bundleKey = String(body?.bundleKey || "").trim().toLowerCase();
    const exactCredits = body?.exactCredits;
    const me = await getOrCreateDemoUser();

    let creditsToAdd = 0;
    if (bundleKey) {
      creditsToAdd = BUNDLES[bundleKey] ?? 0;
      if (!creditsToAdd) {
        return NextResponse.json({ ok: false, error: "Unknown bundleKey" }, { status: 400 });
      }
    } else {
      creditsToAdd = clampInt(exactCredits, 1, 1000);
    }

    const updated = await prisma.user.update({
      where: { id: me.id },
      data: { paidCreditsBalance: (me as any).paidCreditsBalance + creditsToAdd } as any,
      select: { paidCreditsBalance: true, freeCreditsBalance: true },
    });

    return NextResponse.json({
      ok: true,
      added: creditsToAdd,
      paidCreditsBalance: Number((updated as any).paidCreditsBalance ?? 0),
      freeCreditsBalance: Number((updated as any).freeCreditsBalance ?? 0),
      totalCredits: Number((updated as any).paidCreditsBalance ?? 0) + Number((updated as any).freeCreditsBalance ?? 0),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
