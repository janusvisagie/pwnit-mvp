export const runtime = "nodejs";

import { NextResponse } from "next/server";

import {
  buildLoginCodeHash,
  buildSessionToken,
  SESSION_COOKIE,
  getCurrentActor,
  normalizeEmail,
  safeNextPath,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail((body as { email?: unknown })?.email);
    const code = String((body as { code?: unknown })?.code ?? "").trim();
    const next = safeNextPath((body as { next?: unknown })?.next);

    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, error: "Invalid email or code." }, { status: 400 });
    }

    const actor = await getCurrentActor();
    if (!actor.isGuest) {
      return NextResponse.json({ ok: false, error: "You are already signed in." }, { status: 400 });
    }

    const loginCode = await (prisma as any).loginCode.findFirst({
      where: {
        email,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!loginCode) {
      return NextResponse.json({ ok: false, error: "Code expired or not found." }, { status: 400 });
    }

    if (buildLoginCodeHash(email, code) !== String(loginCode.codeHash)) {
      return NextResponse.json({ ok: false, error: "Incorrect code." }, { status: 400 });
    }

    const user = await prisma.$transaction(async (tx) => {
      await (tx as any).loginCode.update({
        where: { id: loginCode.id },
        data: { consumedAt: new Date() },
      });

      const existing = await tx.user.findUnique({ where: { email } });

      if (existing) {
        return tx.user.update({
          where: { id: existing.id },
          data: {
            isGuest: false,
            emailVerifiedAt: new Date(),
          } as any,
        });
      }

      return tx.user.update({
        where: { id: actor.user.id },
        data: {
          email,
          isGuest: false,
          emailVerifiedAt: new Date(),
        } as any,
      });
    });

    const response = NextResponse.json({
      ok: true,
      redirectTo: next,
      email: user.email,
    });

    response.cookies.set(SESSION_COOKIE, buildSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Could not verify code." },
      { status: 500 },
    );
  }
}
