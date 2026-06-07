// Server-only. Issues and verifies a signed "play token" that carries the
// puzzle seed. The seed is generated and signed server-side so the client can't
// shop for an easy seed or pre-compute answers before the clock starts. On
// submit, the server re-derives the rounds from this seed and validates them.
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const TTL_MS = 15 * 60 * 1000; // a game must be submitted within 15 minutes

function secret(): string {
  return (
    process.env.PWNIT2_PLAY_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-only-change-me-before-production"
  );
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function newSeed(): number {
  return randomBytes(4).readUInt32LE(0); // uint32 for mulberry32
}

export function issuePlayToken(userId: string): { seed: number; token: string; issuedAt: number } {
  const seed = newSeed();
  const issuedAt = Date.now();
  const body = Buffer.from(`${seed}.${issuedAt}.${userId}`).toString("base64url");
  const token = `${body}.${sign(body)}`;
  return { seed, token, issuedAt };
}

export function verifyPlayToken(
  token: string,
  userId: string,
): { ok: boolean; seed?: number; reason?: string } {
  if (!token || typeof token !== "string" || !token.includes(".")) return { ok: false, reason: "missing" };
  const idx = token.lastIndexOf(".");
  const body = token.slice(0, idx);
  const sig = token.slice(idx + 1);

  const a = Buffer.from(sig);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "bad-signature" };

  let payload: string;
  try {
    payload = Buffer.from(body, "base64url").toString("utf8");
  } catch {
    return { ok: false, reason: "decode" };
  }
  const parts = payload.split(".");
  if (parts.length !== 3) return { ok: false, reason: "format" };

  const [seedStr, issuedAtStr, tokenUser] = parts;
  if (tokenUser !== userId) return { ok: false, reason: "user-mismatch" };

  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > TTL_MS) return { ok: false, reason: "expired" };

  const seed = Number(seedStr);
  if (!Number.isFinite(seed)) return { ok: false, reason: "seed" };

  return { ok: true, seed };
}
