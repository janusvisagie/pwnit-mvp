// Server-side admin gate for PwnIt 2.
// MVP approach: admins are listed in the ADMIN_EMAILS env var (comma-separated).
// (User.role does not exist on the model yet; switch to role-based here if it is added.)
//
// IMPORTANT: never rely on hiding UI buttons. Every admin route/action must call
// requireAdmin() (route handlers) or assertAdmin() (server actions / RSC) on the server.

import { getCurrentActor } from "@/lib/auth";

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const actor = await getCurrentActor();
    return isAdminEmail(actor?.user?.email ?? null);
  } catch {
    return false;
  }
}

/**
 * For route handlers (app/api/.../route.ts). Returns null when the caller is an admin,
 * otherwise a ready-to-return 403 Response:
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin(): Promise<Response | null> {
  if (await isCurrentUserAdmin()) return null;
  return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

/** For server actions / server components: throws if the caller is not an admin. */
export async function assertAdmin(): Promise<void> {
  if (!(await isCurrentUserAdmin())) {
    throw new Error("Forbidden: admin only");
  }
}
