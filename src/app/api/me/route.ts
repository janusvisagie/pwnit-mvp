// src/app/api/me/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getOrCreateDemoUser, DAILY_FREE_CREDITS } from "@/lib/auth";
import { dayKeyZA } from "@/lib/time";

export async function GET() {
  const me = await getOrCreateDemoUser();
  const free = Number((me as any).freeCreditsBalance ?? 0);
  const paid = Number((me as any).paidCreditsBalance ?? 0);

  return NextResponse.json({
    ok: true,
    email: (me as any).email,
    alias: (me as any).alias ?? null,
    freeCreditsBalance: free,
    paidCreditsBalance: paid,
    totalCredits: free + paid,
    dailyFreeCredits: DAILY_FREE_CREDITS,
    dayKey: dayKeyZA(),
  });
}
