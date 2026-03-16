import { NextResponse } from "next/server";

export const runtime = "nodejs";

const COOKIE_NAME = "pwnit_demo";
const ONE_YEAR = 60 * 60 * 24 * 365;

function normalizeDemoKey(v: unknown) {
  const s = String(v ?? "").trim().toLowerCase();
  return /^demo\d+$/.test(s) ? s : null;
}

function isDemoSwitcherEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEMO_SWITCHER === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_SWITCHER === "true"
  );
}

export async function POST(req: Request) {
  if (!isDemoSwitcherEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Demo switching is disabled in production." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const demoKey = normalizeDemoKey((body as { demoKey?: unknown })?.demoKey) ?? "demo1";

  const res = NextResponse.json({ ok: true, demoKey });
  res.cookies.set(COOKIE_NAME, demoKey, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });

  return res;
}
