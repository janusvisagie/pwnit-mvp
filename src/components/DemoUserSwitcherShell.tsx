// src/components/DemoUserSwitcherShell.tsx
import { cookies } from "next/headers";
import { DemoUserSwitcher } from "@/components/DemoUserSwitcher";

const COOKIE_NAME = "pwnit_demo";

function normalizeDemoId(raw?: string | null) {
  const s = String(raw ?? "").trim().toLowerCase();
  return /^demo\d+$/.test(s) ? s : "demo1";
}

/**
 * Server wrapper that reads the current demo user from cookie and renders
 * the client switcher.
 */
export function DemoUserSwitcherShell() {
  const jar = cookies();
  const current = normalizeDemoId(jar.get(COOKIE_NAME)?.value);
  return <DemoUserSwitcher current={current} />;
}
