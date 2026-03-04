// src/app/api/credits/purchase/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";

function clampInt(n: any, lo: number, hi: number) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return lo;
  return Math.max(lo, Math.min(hi, x));
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // allow either: bundleKey OR exactCredits
    const bundleKey = String(body?.bundleKey || "").trim();
    const exactCredits = body?.exactCredits;

    const me = await getOrCreateDemoUser();

    let creditsToAdd = 0;

    // Bundles (existing behavior)
    if (bundleKey) {
      if (bundleKey === "small") creditsToAdd = 10;
      else if (bundleKey === "medium") creditsToAdd = 25;
      else if (bundleKey === "large") creditsToAdd = 60;
      else return NextResponse.json({ ok: false, error: "Unknown bundleKey" }, { status: 400 });
    } else {
      // Exact credits (new behavior)
      creditsToAdd = clampInt(exactCredits, 1, 500); // safety cap
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
