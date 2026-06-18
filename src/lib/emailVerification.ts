import { randomBytes, createHmac } from "crypto";

import { prisma } from "@/lib/db";

export const VERIFICATION_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

// 32 chars, no ambiguous 0/O/1/I. 256 is divisible by 32, so byte % 32 is unbiased.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

function hashCode(code: string): string {
  const secret =
    process.env.AUTH_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-only-change-me-before-production";
  return createHmac("sha256", secret).update(code.trim().toUpperCase()).digest("hex");
}

// Returns the plaintext code to email, or null if we're still inside the
// resend cooldown for this email (caller should ask the user to wait).
export async function issueVerificationCode(email: string): Promise<string | null> {
  const recent = await prisma.loginCode.findFirst({
    where: {
      email,
      consumedAt: null,
      createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (recent) return null;

  const code = generateCode();
  await prisma.loginCode.create({
    data: {
      email,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });
  return code;
}

export async function confirmVerificationCode(
  email: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const match = await prisma.loginCode.findFirst({
    where: {
      email,
      codeHash: hashCode(code),
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (!match) return { ok: false, error: "That code is invalid or has expired." };

  const now = new Date();
  await prisma.$transaction([
    prisma.loginCode.update({ where: { id: match.id }, data: { consumedAt: now } }),
    prisma.user.update({ where: { email }, data: { emailVerifiedAt: now } }),
  ]);
  return { ok: true };
}
