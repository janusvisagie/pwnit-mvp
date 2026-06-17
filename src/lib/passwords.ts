import { randomBytes, scryptSync, timingSafeEqual, createHash } from "crypto";

export const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;
const KEY_LENGTH = 64;

// scrypt cost parameters for NEW hashes. N=2^16 is a deliberate step up from
// Node's default 2^14 and aligns with OWASP guidance for scrypt. Tunable: if
// you ever see register/login latency or memory pressure on Vercel, drop N to
// 32768 — existing hashes keep verifying because the parameters are stored
// inside each hash string (see format below).
const SCRYPT_N = 65536;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

// scrypt memory use ≈ 128 * N * r bytes; maxmem must exceed that or it throws.
// (This is the footgun: Node's default maxmem of 32MB rejects N=2^16.)
function maxmemFor(n: number, r: number) {
  return 128 * n * r * 2; // 2x headroom for p=1
}

const HIBP_TIMEOUT_MS = 2500;

// Length-over-composition: a minimum length, a sane maximum, no character-class
// rules. The breached-password check below carries the real weight.
export function validatePassword(raw: unknown) {
  const value = String(raw ?? "");
  const password = value.trim();

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false as const,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      ok: false as const,
      error: "Password is too long.",
    };
  }

  return {
    ok: true as const,
    password,
  };
}

// New format:    scrypt$N$r$p$saltHex$derivedHex   (parameters embedded)
// Legacy format: scrypt$saltHex$derivedHex          (implied N=16384,r=8,p=1)
// verifyPassword reads both, so existing stored hashes keep working.
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: maxmemFor(SCRYPT_N, SCRYPT_R),
  }).toString("hex");
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  const raw = String(storedHash ?? "");
  const parts = raw.split("$");

  let salt: string;
  let expectedHex: string;
  let N = 16384; // Node's old default — what legacy 3-part hashes were made with
  let r = 8;
  let p = 1;

  if (parts.length === 6 && parts[0] === "scrypt") {
    N = Number(parts[1]) || N;
    r = Number(parts[2]) || r;
    p = Number(parts[3]) || p;
    salt = parts[4];
    expectedHex = parts[5];
  } else if (parts.length === 3 && parts[0] === "scrypt") {
    salt = parts[1];
    expectedHex = parts[2];
  } else {
    return false;
  }

  if (!salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, "hex");
  let actual: Buffer;
  try {
    actual = Buffer.from(
      scryptSync(password, salt, expected.length, {
        N,
        r,
        p,
        maxmem: maxmemFor(N, r),
      }),
    );
  } catch {
    return false;
  }

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

// True if the stored hash is legacy or below current cost — re-hash next time
// the plaintext is in hand (e.g. on successful login) to migrate users forward
// transparently. Wire this into the login route when convenient.
export function needsRehash(storedHash: string | null | undefined) {
  const parts = String(storedHash ?? "").split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return true;
  return (Number(parts[1]) || 0) < SCRYPT_N;
}

// HaveIBeenPwned "Pwned Passwords" range check via k-anonymity: SHA-1 the
// password, send only the first 5 hex chars, match the suffix locally. The
// password never leaves the server. Fails OPEN — if HIBP is unreachable we
// allow the password rather than block signup.
export async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const sha1 = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HIBP_TIMEOUT_MS);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) return false;
    const text = await res.text();

    for (const line of text.split("\n")) {
      const [hashSuffix, countStr] = line.trim().split(":");
      if (hashSuffix === suffix && Number(countStr) > 0) {
        return true;
      }
    }
    return false;
  } catch {
    return false; // fail open
  }
}
