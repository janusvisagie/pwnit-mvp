import { NextResponse, type NextRequest } from "next/server";

const GUEST_COOKIE = "pwnit_guest";
const BUCKET_COOKIE = "pwnit_bucket";
const ID_RE = /^[a-z0-9_-]{8,120}$/i;
const ONE_YEAR = 60 * 60 * 24 * 365;

function normalizeId(raw?: string | null) {
  const value = String(raw ?? "").trim();
  return ID_RE.test(value) ? value : null;
}

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

export function middleware(req: NextRequest) {
  const existingGuest = normalizeId(req.cookies.get(GUEST_COOKIE)?.value);
  const existingBucket = normalizeId(req.cookies.get(BUCKET_COOKIE)?.value);
  const guestId = existingGuest || makeId("guest");
  const bucketId = existingBucket || makeId("bucket");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pwnit-guest-id", guestId);
  requestHeaders.set("x-pwnit-bucket-id", bucketId);

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

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
