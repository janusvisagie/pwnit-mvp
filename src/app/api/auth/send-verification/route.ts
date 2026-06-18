export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getCurrentActor } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { issueVerificationCode } from "@/lib/emailVerification";

export async function POST() {
  const actor = await getCurrentActor();

  if (actor.isGuest || !actor.user?.email) {
    return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  }

  if (actor.user.emailVerifiedAt) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const code = await issueVerificationCode(actor.user.email);
  if (!code) {
    return NextResponse.json(
      { ok: false, error: "A code was just sent. Please wait a minute before requesting another." },
      { status: 429 },
    );
  }

  try {
    await sendVerificationEmail(actor.user.email, code);
  } catch {
    return NextResponse.json(
      { ok: false, error: "We couldn't send the email right now. Please try again shortly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
