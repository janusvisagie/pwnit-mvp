export const runtime = "nodejs";

import { NextResponse } from "next/server";

import {
  buildLoginCodeHash,
  getBucketKeyFromRequest,
  getRequestIp,
  hashForRateLimit,
  normalizeEmail,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendLoginCodeEmail } from "@/lib/email";

const CODE_TTL_MS = 10 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL_WINDOW = 3;
const MAX_PER_IP_WINDOW = 10;

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail((body as { email?: unknown })?.email);

    if (!email) {
      return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    const bucketKey = getBucketKeyFromRequest();
    const ipHash = hashForRateLimit(getRequestIp());
    const since = new Date(Date.now() - WINDOW_MS);

    const [emailCount, ipCount] = await Promise.all([
      (prisma as any).loginCode.count({
        where: {
          email,
          createdAt: { gte: since },
        },
      }),
      (prisma as any).loginCode.count({
        where: {
          ipHash,
          createdAt: { gte: since },
        },
      }),
    ]);

    if (emailCount >= MAX_PER_EMAIL_WINDOW || ipCount >= MAX_PER_IP_WINDOW) {
      return NextResponse.json(
        { ok: false, error: "Too many sign-in requests. Please wait a few minutes and try again." },
        { status: 429 },
      );
    }

    const code = makeCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await (prisma as any).loginCode.create({
      data: {
        email,
        codeHash: buildLoginCodeHash(email, code),
        bucketKey,
        ipHash,
        expiresAt,
      },
    });

    const sent = await sendLoginCodeEmail({ to: email, code });

    return NextResponse.json({
      ok: true,
      email,
      ...(sent.devCode ? { devCode: sent.devCode } : {}),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Could not send sign-in code." },
      { status: 500 },
    );
  }
}
