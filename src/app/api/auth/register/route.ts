
export const runtime = "nodejs";

import { NextResponse } from "next/server";

import {
  buildSessionToken,
  DEV_DEMO_COOKIE,
  getCurrentActor,
  getRequestIp,
  normalizeEmail,
  safeNextPath,
  SESSION_COOKIE,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/passwords";
import { validateTurnstileToken } from "@/lib/turnstile";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body?.email);
  const passwordCheck = validatePassword(body?.password);
  const nextPath = safeNextPath(body?.next ?? "/");
  const turnstile = await validateTurnstileToken({
    token: body?.turnstileToken,
    remoteIp: getRequestIp(),
  });

  if (!turnstile.ok) {
    return NextResponse.json(
      { ok: false, error: "Please complete the human check before creating an account." },
      { status: 403 },
    );
  }

  if (!email) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!passwordCheck.ok) {
    return NextResponse.json({ ok: false, error: passwordCheck.error }, { status: 400 });
  }

  const actor = await getCurrentActor();
  const passwordHash = hashPassword(passwordCheck.password);
  const now = new Date();
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isGuest: true, passwordHash: true },
  });

  let userId: string;
  if (!actor.isGuest && !actor.isDemoUser) {
    if (actor.user.email !== email) {
      return NextResponse.json(
        {
          ok: false,
          error: `You are already signed in as ${actor.user.email}. Please sign out first if you want a different account.`,
        },
        { status: 409 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: actor.user.id },
      data: {
        passwordHash,
        passwordSetAt: now,
        emailVerifiedAt: actor.user.emailVerifiedAt ?? now,
      },
      select: { id: true },
    });
    userId = updated.id;
  } else if (existing && existing.id !== actor.user.id) {
    return NextResponse.json(
      {
        ok: false,
        error: "That email is already in use. Please sign in instead.",
      },
      { status: 409 },
    );
  } else if (actor.isGuest && !actor.isDemoUser) {
    const updated = await prisma.user.update({
      where: { id: actor.user.id },
      data: {
        email,
        isGuest: false,
        passwordHash,
        passwordSetAt: now,
        emailVerifiedAt: now,
      } as any,
      select: { id: true },
    });
    userId = updated.id;
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        isGuest: false,
        passwordHash,
        passwordSetAt: now,
        emailVerifiedAt: now,
        freeCreditsBalance: 0,
        paidCreditsBalance: 0,
      } as any,
      select: { id: true },
    });
    userId = created.id;
  }

  const response = NextResponse.json({ ok: true, nextPath });
  response.cookies.set(SESSION_COOKIE, buildSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set(DEV_DEMO_COOKIE, "", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
