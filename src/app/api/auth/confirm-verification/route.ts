export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getCurrentActor } from "@/lib/auth";
import { confirmVerificationCode } from "@/lib/emailVerification";

export async function POST(req: Request) {
  const actor = await getCurrentActor();

  if (actor.isGuest || !actor.user?.email) {
    return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  }

  if (actor.user.emailVerifiedAt) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const body = await req.json().catch(() => ({} as any));
  const code = String(body?.code ?? "").trim();

  if (!code) {
    return NextResponse.json({ ok: false, error: "Please enter the code from your email." }, { status: 400 });
  }

  const result = await confirmVerificationCode(actor.user.email, code);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
