import { NextResponse } from "next/server";
import { dayKeyZA } from "@/lib/time";

export async function POST(req: Request) {
  // We don't *need* the body yet, but accepting it avoids client-side surprises.
  await req.json().catch(() => null);

  return NextResponse.json({
    ok: true,
    serverStartMs: Date.now(),
    dayKey: dayKeyZA(),
  });
}
