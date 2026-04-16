export const runtime = "nodejs";

import { NextResponse } from "next/server";

import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE,
  REFERRAL_ITEM_COOKIE,
  normalizeReferralCode,
} from "@/lib/referrals";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = normalizeReferralCode((body as { code?: unknown })?.code);
  const itemId = String((body as { itemId?: unknown })?.itemId ?? "").trim();

  if (!code) {
    return NextResponse.json({ ok: false, error: "Please enter a valid referral code." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, code, itemId: itemId || null });
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFERRAL_COOKIE_MAX_AGE,
  };

  response.cookies.set(REFERRAL_COOKIE, code, cookieOptions);
  if (itemId) {
    response.cookies.set(REFERRAL_ITEM_COOKIE, itemId, cookieOptions);
  }

  return response;
}
