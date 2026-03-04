// src/app/api/demo/switch/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const COOKIE_NAME = "pwnit_demo";
const ONE_YEAR = 60 * 60 * 24 * 365;

function normalizeDemoKey(v: any) {
  const s = String(v ?? "").trim().toLowerCase();
  return /^demo\d+$/.test(s) ? s : null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const demoKey = normalizeDemoKey(body?.demoKey) ?? "demo1";

  const res = NextResponse.json({ ok: true, demoKey });

  // ✅ Single source of truth for demo identity
  res.cookies.set(COOKIE_NAME, demoKey, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });

  return res;
}