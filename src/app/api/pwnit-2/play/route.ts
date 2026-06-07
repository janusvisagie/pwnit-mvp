export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCurrentActor } from "@/lib/auth";
import { issuePlayToken } from "@/lib/pwnit2PlayToken";
import { PWNIT2_PUZZLE_CONFIG } from "@/lib/pwnit2Puzzle";

// GET /api/pwnit-2/play -> a fresh server-signed seed for one game.
export async function GET() {
  try {
    const actor = await getCurrentActor();
    const { seed, token } = issuePlayToken(actor.user.id);
    return NextResponse.json({
      ok: true,
      seed,
      token,
      serverStartMs: Date.now(),
      config: PWNIT2_PUZZLE_CONFIG,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Could not start a game." },
      { status: 500 },
    );
  }
}
