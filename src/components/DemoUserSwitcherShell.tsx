import { cookies } from "next/headers";
import { DemoUserSwitcher } from "@/components/DemoUserSwitcher";

const COOKIE_NAME = "pwnit_demo";

function normalizeDemoId(raw?: string | null) {
  const s = String(raw ?? "").trim().toLowerCase();
  return /^demo\d+$/.test(s) ? s : "demo1";
}

function isDemoSwitcherEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEMO_SWITCHER === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_SWITCHER === "true"
  );
}

/**
 * Server wrapper that reads the current demo user from cookie and renders
 * the client switcher only in local/dev (or when explicitly re-enabled).
 */
export function DemoUserSwitcherShell() {
  if (!isDemoSwitcherEnabled()) {
    return null;
  }

  const jar = cookies();
  const current = normalizeDemoId(jar.get(COOKIE_NAME)?.value);

  return <DemoUserSwitcher current={current} />;
}
