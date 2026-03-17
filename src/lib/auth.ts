import { Prisma } from "@prisma/client";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";

export const DAILY_FREE_CREDITS = 30;
export const SESSION_COOKIE = "pwnit_session";
export const GUEST_COOKIE = "pwnit_guest";
export const BUCKET_COOKIE = "pwnit_bucket";
export const DEV_DEMO_COOKIE = "pwnit_demo_user";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const GUEST_ID_RE = /^[a-z0-9_-]{8,120}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const actorUserSelect = {
  id: true,
  email: true,
  alias: true,
  isGuest: true,
  emailVerifiedAt: true,
  freeCreditsBalance: true,
  paidCreditsBalance: true,
  lastDailyCreditsDayKey: true,
} as const;

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

type CurrentActor = {
  user: ActorUser;
  isGuest: boolean;
  bucketKey: string;
  isLocalDev: boolean;
  demoUserKey: string | null;
  isDemoUser: boolean;
};

const LOCAL_DEMO_USERS = {
  demo1: {
    email: "demo1@pwnit.local",
    alias: "Demo User 1",
    referralCode: "demo1",
  },
  demo2: {
    email: "demo2@pwnit.local",
    alias: "Demo User 2",
    referralCode: "demo2",
  },
  demo3: {
    email: "demo3@pwnit.local",
    alias: "Demo User 3",
    referralCode: "demo3",
  },
} as const;

type DemoUserKey = keyof typeof LOCAL_DEMO_USERS;

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
  return process.env.AUTH_SESSION_SECRET || process.env.NEXTAUTH_SECRET || "dev-only-change-me-before-production";
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

function normalizeDemoUserKey(raw: string | null | undefined): DemoUserKey | null {
  const value = String(raw ?? "").trim().toLowerCase();

  if (["1", "demo1", "user1"].includes(value)) return "demo1";
  if (["2", "demo2", "user2"].includes(value)) return "demo2";
  if (["3", "demo3", "user3"].includes(value)) return "demo3";

  return null;
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

function getHost() {
  return String(readHeader("host") ?? "").trim().toLowerCase();
}

function isLocalDevRequest() {
  const host = getHost();
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:") || host === "localhost" || host === "127.0.0.1";
}

function getLocalDemoUserFromRequest() {
  if (!isLocalDevRequest()) return null;

  return (
    normalizeDemoUserKey(readCookie(DEV_DEMO_COOKIE)) ||
    normalizeDemoUserKey(readHeader("x-pwnit-demo-user")) ||
    null
  );
}

export function getGuestKeyFromRequest() {
  return normalizeOpaqueId(readCookie(GUEST_COOKIE)) || normalizeOpaqueId(readHeader("x-pwnit-guest-id")) || "guest_fallback_local";
}

export function getBucketKeyFromRequest() {
  return normalizeOpaqueId(readCookie(BUCKET_COOKIE)) || normalizeOpaqueId(readHeader("x-pwnit-bucket-id")) || "bucket_fallback_local";
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
    select: actorUserSelect,
  });

  return toActorUser(user);
}

async function findUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: actorUserSelect,
  });

  return toActorUser(user);
}

async function createUserWithEmailFallback(data: Record<string, unknown>): Promise<ActorUser> {
  const email = String(data.email ?? "").trim().toLowerCase();
  if (!email) {
    throw new Error("Cannot create user without an email.");
  }

  try {
    const created = await prisma.user.create({
      data: data as any,
      select: actorUserSelect,
    });

    return toActorUser(created)!;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await findUserByEmail(email);
      if (existing) return existing;
    }

    throw error;
  }
}

async function getOrCreateGuestUserByKey(guestKey: string): Promise<ActorUser> {
  const guestEmail = `${guestKey}@guest.pwnit.local`;

  const existing = await findUserByEmail(guestEmail);
  if (existing?.isGuest) {
    return existing;
  }

  return createUserWithEmailFallback({
    email: guestEmail,
    referralCode: "guest",
    isGuest: true,
    freeCreditsBalance: 0,
    paidCreditsBalance: 0,
  });
}

async function getOrCreateLocalDemoUser(demoUserKey: DemoUserKey): Promise<ActorUser> {
  const config = LOCAL_DEMO_USERS[demoUserKey];
  const existing = await findUserByEmail(config.email);

  if (existing && !existing.isGuest) {
    return existing;
  }

  return createUserWithEmailFallback({
    email: config.email,
    alias: config.alias,
    referralCode: config.referralCode,
    isGuest: false,
    emailVerifiedAt: new Date(),
    freeCreditsBalance: 0,
    paidCreditsBalance: 0,
  });
}

async function applyLocalDemoCredits(user: ActorUser): Promise<ActorUser> {
  const today = dayKeyZA();
  const hasCredits = Number(user.freeCreditsBalance ?? 0) > 0;
  const lastKey = String(user.lastDailyCreditsDayKey ?? "");

  if (lastKey === today && hasCredits) return user;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      freeCreditsBalance: hasCredits ? Number(user.freeCreditsBalance ?? 0) : DAILY_FREE_CREDITS,
      lastDailyCreditsDayKey: today,
    } as any,
    select: actorUserSelect,
  });

  if (!hasCredits) {
    await prisma.creditLedger.create({
      data: {
        userId: user.id,
        kind: "DAILY_FREE",
        credits: DAILY_FREE_CREDITS,
        note: `Local demo credits for ${today}`,
      },
    });
  }

  return toActorUser(updated)!;
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
      select: actorUserSelect,
    });

    return toActorUser(updated)!;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const grantResult = await (tx as any).dailyFreeBucketGrant.createMany({
      data: [
        {
          bucketKey,
          dayKey: today,
          userId: user.id,
          credits: DAILY_FREE_CREDITS,
        },
      ],
      skipDuplicates: true,
    });

    if (!grantResult?.count) {
      const alreadyUsed = await tx.user.update({
        where: { id: user.id },
        data: { lastDailyCreditsDayKey: today } as any,
        select: actorUserSelect,
      });

      return alreadyUsed;
    }

    const refreshed = await tx.user.update({
      where: { id: user.id },
      data: {
        freeCreditsBalance: DAILY_FREE_CREDITS,
        lastDailyCreditsDayKey: today,
      } as any,
      select: actorUserSelect,
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

export async function getCurrentActor(): Promise<CurrentActor> {
  const bucketKey = getBucketKeyFromRequest();
  const isLocalDev = isLocalDevRequest();
  const demoUserKey = getLocalDemoUserFromRequest();

  if (demoUserKey) {
    return {
      user: await applyLocalDemoCredits(await getOrCreateLocalDemoUser(demoUserKey)),
      isGuest: false,
      bucketKey,
      isLocalDev,
      demoUserKey,
      isDemoUser: true,
    };
  }

  const sessionUser = await getSessionUserFromRequest();

  if (sessionUser && !sessionUser.isGuest) {
    return {
      user: await applyDailyCredits(sessionUser, bucketKey),
      isGuest: false,
      bucketKey,
      isLocalDev,
      demoUserKey: null,
      isDemoUser: false,
    };
  }

  const guestKey = getGuestKeyFromRequest();
  const guestUser = await getOrCreateGuestUserByKey(guestKey);

  return {
    user: await applyDailyCredits(guestUser, bucketKey),
    isGuest: true,
    bucketKey,
    isLocalDev,
    demoUserKey: null,
    isDemoUser: false,
  };
}

export async function getCurrentUserSummary() {
  const actor = await getCurrentActor();
  const user = actor.user;

  return {
    id: user.id,
    isGuest: actor.isGuest,
    isDemoUser: actor.isDemoUser,
    isLocalDev: actor.isLocalDev,
    demoUserKey: actor.demoUserKey,
    email: actor.isGuest ? null : user.email,
    emailVerified: !actor.isGuest && Boolean(user.emailVerifiedAt),
    actorLabel: actor.isGuest ? "Playing as Guest" : user.alias || user.email,
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
