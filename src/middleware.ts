import { NextResponse, type NextRequest } from "next/server";

const GUEST_COOKIE = "pwnit_guest";
const BUCKET_COOKIE = "pwnit_bucket";
const REFERRAL_COOKIE = "pwnit_referral";
const ID_RE = /^[a-z0-9_-]{8,120}$/i;
const REFERRAL_RE = /^[A-Z0-9]{6,12}$/;
const ONE_YEAR = 60 * 60 * 24 * 365;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function normalizeId(raw?: string | null) {
  const value = String(raw ?? "").trim();
  return ID_RE.test(value) ? value : null;
}

function normalizeReferralCode(raw?: string | null) {
  const value = String(raw ?? "").trim().toUpperCase();
  return REFERRAL_RE.test(value) ? value : null;
}

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

export function middleware(req: NextRequest) {
  const existingGuest = normalizeId(req.cookies.get(GUEST_COOKIE)?.value);
  const existingBucket = normalizeId(req.cookies.get(BUCKET_COOKIE)?.value);
  const queryReferral = normalizeReferralCode(req.nextUrl.searchParams.get("ref"));
  const existingReferral = normalizeReferralCode(req.cookies.get(REFERRAL_COOKIE)?.value);
  const guestId = existingGuest || makeId("guest");
  const bucketId = existingBucket || makeId("bucket");
  const referralCode = queryReferral || existingReferral;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pwnit-guest-id", guestId);
  requestHeaders.set("x-pwnit-bucket-id", bucketId);
  if (referralCode) {
    requestHeaders.set("x-pwnit-referral-code", referralCode);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (!existingGuest) {
    response.cookies.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR,
    });
  }

  if (!existingBucket) {
    response.cookies.set(BUCKET_COOKIE, bucketId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR,
    });
  }

  if (queryReferral) {
    response.cookies.set(REFERRAL_COOKIE, queryReferral, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: THIRTY_DAYS,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
