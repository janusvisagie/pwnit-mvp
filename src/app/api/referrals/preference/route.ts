export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getCurrentActor } from "@/lib/auth";
import { normalizeReferralRewardType, setReferralRewardPreference } from "@/lib/referrals";

export async function POST(req: Request) {
  const actor = await getCurrentActor();
  if (actor.isGuest || actor.isDemoUser) {
    return NextResponse.json({ ok: false, error: "Please sign in to change your referral reward preference." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const preference = normalizeReferralRewardType((body as { preference?: unknown })?.preference);
  const saved = await setReferralRewardPreference(actor.user.id, preference);
  return NextResponse.json({ ok: true, preference: saved });
}
