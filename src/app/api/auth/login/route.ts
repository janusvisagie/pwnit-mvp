export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { buildSessionToken, DEV_DEMO_COOKIE, normalizeEmail, safeNextPath, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validatePassword, verifyPassword } from "@/lib/passwords";

const loginSelect = {
  id: true,
  email: true,
  isGuest: true,
  passwordHash: true,
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body?.email);
  const passwordCheck = validatePassword(body?.password);
  const nextPath = safeNextPath(body?.next ?? "/");

  if (!email) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!passwordCheck.ok) {
    return NextResponse.json({ ok: false, error: passwordCheck.error }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: loginSelect,
  });

  if (!user || user.isGuest || !user.passwordHash || !verifyPassword(passwordCheck.password, user.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Incorrect email or password." }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    nextPath,
  });

  response.cookies.set(SESSION_COOKIE, buildSessionToken(user.id), {
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
