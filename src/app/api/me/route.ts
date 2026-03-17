export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { DAILY_FREE_CREDITS, getCurrentUserSummary } from "@/lib/auth";
import { dayKeyZA } from "@/lib/time";

export async function GET() {
  const me = await getCurrentUserSummary();
  const free = Number(me.freeCreditsBalance ?? 0);
  const paid = Number(me.paidCreditsBalance ?? 0);

  return NextResponse.json({
    ok: true,
    isGuest: me.isGuest,
    actorLabel: me.actorLabel,
    email: me.email,
    alias: me.alias,
    emailVerified: me.emailVerified,
    freeCreditsBalance: free,
    paidCreditsBalance: paid,
    totalCredits: free + paid,
    dailyFreeCredits: DAILY_FREE_CREDITS,
    dayKey: dayKeyZA(),
  });
}
