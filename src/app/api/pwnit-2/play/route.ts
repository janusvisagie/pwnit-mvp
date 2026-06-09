export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCurrentActor } from "@/lib/auth";
import { issuePlayToken } from "@/lib/pwnit2PlayToken";
import { PWNIT2_GAUNTLET_CONFIG } from "@/lib/pwnit2Gauntlet";

// GET /api/pwnit-2/play?item=hero -> a fresh server-signed seed for one gauntlet run.
export async function GET(req: Request) {
  try {
    const slug = new URL(req.url).searchParams.get("item") === "staple" ? "staple" : "hero";
    const actor = await getCurrentActor();
    const { seed, token } = issuePlayToken(actor.user.id, slug);
    return NextResponse.json({ ok: true, slug, seed, token, serverStartMs: Date.now(), config: PWNIT2_GAUNTLET_CONFIG });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Could not start a game." }, { status: 500 });
  }
}
