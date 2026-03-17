import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";

export const DAILY_FREE_CREDITS = 30;
export const SESSION_COOKIE = "pwnit_session";
export const GUEST_COOKIE = "pwnit_guest";
export const BUCKET_COOKIE = "pwnit_bucket";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const GUEST_ID_RE = /^[a-z0-9_-]{8,120}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ActorUser = {
  id: string;
  email: string;
  alias?: string | null;
  isGuest?: boolean;
  emailVerifiedAt?: Date | null;
  freeCreditsBalance?: number | null;
  paidCreditsBalance?: number | null;
  lastDailyCreditsDayKey?: string | null;
};

function toActorUser(record: any): ActorUser | null {
  if (!record || !record.id || !record.email) return null;

  return {
    id: String(record.id),
    email: String(record.email),
    alias: record.alias ?? null,
    isGuest: Boolean(record.isGuest),
    emailVerifiedAt: record.emailVerifiedAt ?? null,
    freeCreditsBalance: record.freeCreditsBalance ?? null,
    paidCreditsBalance: record.paidCreditsBalance ?? null,
    lastDailyCreditsDayKey: record.lastDailyCreditsDayKey ?? null,
  };
}

function sessionSecret() {
  return (
    process.env.AUTH_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-only-change-me-before-production"
  );
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function normalizeOpaqueId(raw: string | null | undefined) {
  const value = String(raw ?? "").trim();
  return GUEST_ID_RE.test(value) ? value : null;
}

function readCookie(name: string) {
  try {
    return cookies().get(name)?.value ?? null;
  } catch {
    return null;
  }
}

function readHeader(name: string) {
  try {
    return headers().get(name);
  } catch {
    return null;
  }
}

export function getGuestKeyFromRequest() {
  return (
    normalizeOpaqueId(readCookie(GUEST_COOKIE)) ||
    normalizeOpaqueId(readHeader("x-pwnit-guest-id")) ||
    "guest_fallback_local"
  );
}

export function getBucketKeyFromRequest() {
  return (
    normalizeOpaqueId(readCookie(BUCKET_COOKIE)) ||
    normalizeOpaqueId(readHeader("x-pwnit-bucket-id")) ||
    "bucket_fallback_local"
  );
}

export function getRequestIp() {
  const forwarded = readHeader("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return readHeader("x-real-ip") || "unknown";
}

export function hashForRateLimit(raw: string) {
  return createHmac("sha256", sessionSecret())
    .update(`rate:${String(raw || "")}`)
    .digest("hex");
}

export function normalizeEmail(raw: unknown) {
  const value = String(raw ?? "").trim().toLowerCase();
  return EMAIL_RE.test(value) ? value : null;
}

export function buildLoginCodeHash(email: string, code: string) {
  return createHmac("sha256", sessionSecret())
    .update(`login-code:${email}:${code}`)
    .digest("hex");
}

export function buildSessionToken(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({
      uid: userId,
      exp: Date.now() + SESSION_TTL_SECONDS * 1000,
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function readSessionUserId(token: string | null | undefined) {
  const raw = String(token ?? "").trim();
  const [payload, signature] = raw.split(".");

  if (!payload || !signature) return null;
  if (!safeEqual(sign(payload), signature)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      uid?: string;
      exp?: number;
    };

    if (!parsed?.uid || !parsed?.exp) return null;
    if (Date.now() > Number(parsed.exp)) return null;

    return String(parsed.uid);
  } catch {
    return null;
  }
}

async function getSessionUserFromRequest(): Promise<ActorUser | null> {
  const sessionToken = readCookie(SESSION_COOKIE);
  const userId = readSessionUserId(sessionToken);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      alias: true,
      isGuest: true,
      emailVerifiedAt: true,
      freeCreditsBalance: true,
      paidCreditsBalance: true,
      lastDailyCreditsDayKey: true,
    } as any,
  });

  return toActorUser(user);
}

async function getOrCreateGuestUserByKey(guestKey: string): Promise<ActorUser> {
  const guestEmail = `${guestKey}@guest.pwnit.local`;

  const existing = await prisma.user.findUnique({
    where: { email: guestEmail },
    select: {
      id: true,
      email: true,
      alias: true,
      isGuest: true,
      emailVerifiedAt: true,
      freeCreditsBalance: true,
      paidCreditsBalance: true,
      lastDailyCreditsDayKey: true,
    } as any,
  });

  const existingActor = toActorUser(existing);
  if (existingActor?.isGuest) {
    return existingActor;
  }

  const created = await prisma.user.create({
    data: {
      email: guestEmail,
      referralCode: "guest",
      isGuest: true,
      freeCreditsBalance: 0,
      paidCreditsBalance: 0,
    } as any,
    select: {
      id: true,
      email: true,
      alias: true,
      isGuest: true,
      emailVerifiedAt: true,
      freeCreditsBalance: true,
      paidCreditsBalance: true,
      lastDailyCreditsDayKey: true,
    } as any,
  });

  return toActorUser(created)!;
}

async function applyDailyCredits(user: ActorUser, bucketKey: string): Promise<ActorUser> {
  const today = dayKeyZA();
  const lastKey = String(user.lastDailyCreditsDayKey ?? "");

  if (lastKey === today) return user;

  const bucketGrant = await (prisma as any).dailyFreeBucketGrant.findUnique({
    where: {
      bucketKey_dayKey: {
        bucketKey,
        dayKey: today,
      },
    },
  });

  if (bucketGrant) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastDailyCreditsDayKey: today } as any,
      select: {
        id: true,
        email: true,
        alias: true,
        isGuest: true,
        emailVerifiedAt: true,
        freeCreditsBalance: true,
        paidCreditsBalance: true,
        lastDailyCreditsDayKey: true,
      } as any,
    });

    return toActorUser(updated)!;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const refreshed = await tx.user.update({
      where: { id: user.id },
      data: {
        freeCreditsBalance: DAILY_FREE_CREDITS,
        lastDailyCreditsDayKey: today,
      } as any,
      select: {
        id: true,
        email: true,
        alias: true,
        isGuest: true,
        emailVerifiedAt: true,
        freeCreditsBalance: true,
        paidCreditsBalance: true,
        lastDailyCreditsDayKey: true,
      } as any,
    });

    await (tx as any).dailyFreeBucketGrant.create({
      data: {
        bucketKey,
        dayKey: today,
        userId: user.id,
        credits: DAILY_FREE_CREDITS,
      },
    });

    await tx.creditLedger.create({
      data: {
        userId: user.id,
        kind: "DAILY_FREE",
        credits: DAILY_FREE_CREDITS,
        note: `Daily free credits for ${today}`,
      },
    });

    return refreshed;
  });

  return toActorUser(updated)!;
}

export async function getCurrentActor() {
  const bucketKey = getBucketKeyFromRequest();
  const sessionUser = await getSessionUserFromRequest();

  if (sessionUser && !sessionUser.isGuest) {
    return {
      user: await applyDailyCredits(sessionUser, bucketKey),
      isGuest: false,
      bucketKey,
    };
  }

  const guestKey = getGuestKeyFromRequest();
  const guestUser = await getOrCreateGuestUserByKey(guestKey);

  return {
    user: await applyDailyCredits(guestUser, bucketKey),
    isGuest: true,
    bucketKey,
  };
}

export async function getCurrentUserSummary() {
  const actor = await getCurrentActor();
  const user = actor.user;

  return {
    id: user.id,
    isGuest: actor.isGuest,
    email: actor.isGuest ? null : user.email,
    emailVerified: !actor.isGuest && Boolean(user.emailVerifiedAt),
    actorLabel: actor.isGuest ? "Playing as Guest" : user.email,
    alias: user.alias ?? null,
    freeCreditsBalance: Number(user.freeCreditsBalance ?? 0),
    paidCreditsBalance: Number(user.paidCreditsBalance ?? 0),
  };
}

export async function requireVerifiedAccount() {
  const actor = await getCurrentActor();

  if (actor.isGuest || !actor.user.emailVerifiedAt) {
    return {
      ok: false as const,
      status: 401,
      error: "Please sign in with your email to continue.",
      actor,
    };
  }

  return {
    ok: true as const,
    user: actor.user,
    actor,
  };
}

export function safeNextPath(raw: unknown) {
  const value = String(raw ?? "").trim();

  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";

  return value;
}

// Backward-compatible export name so the rest of the existing code keeps working.
export async function getOrCreateDemoUser() {
  return (await getCurrentActor()).user;
}
