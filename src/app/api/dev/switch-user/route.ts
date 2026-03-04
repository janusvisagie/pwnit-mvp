import { NextResponse } from "next/server";

const DEMO_COOKIE = "miy_as";

function safeDemoKey(raw: string | null) {
  const v = String(raw ?? "demo1").toLowerCase().trim();
  if (/^demo\d{1,2}$/.test(v)) return v;
  return "demo1";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const as = safeDemoKey(url.searchParams.get("as"));
  const ret = url.searchParams.get("return") ?? "/";

  const res = NextResponse.redirect(new URL(ret, url.origin));

  res.cookies.set(DEMO_COOKIE, as, {
    path: "/",
    httpOnly: false, // dev convenience
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
