export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE, normalizeReferralCode } from "@/lib/referrals";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = normalizeReferralCode((body as { code?: unknown })?.code);

  if (!code) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid referral code." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ ok: true, code });
  response.cookies.set(REFERRAL_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFERRAL_COOKIE_MAX_AGE,
  });

  return response;
}
