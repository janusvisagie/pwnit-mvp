import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const MIN_PASSWORD_LENGTH = 8;
const KEY_LENGTH = 64;

export function validatePassword(raw: unknown) {
  const value = String(raw ?? "");
  const password = value.trim();

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false as const,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    };
  }

  if (password.length > 200) {
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

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  const raw = String(storedHash ?? "");
  const [scheme, salt, expectedHex] = raw.split("$");

  if (scheme !== "scrypt" || !salt || !expectedHex) return false;

  const actual = Buffer.from(scryptSync(password, salt, KEY_LENGTH));
  const expected = Buffer.from(expectedHex, "hex");

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
