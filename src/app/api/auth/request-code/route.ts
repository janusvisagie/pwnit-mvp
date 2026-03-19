import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Email code sign-in has been replaced by email + password auth. Use /api/auth/register or /api/auth/login instead.",
    },
    { status: 410 }
  );
}
