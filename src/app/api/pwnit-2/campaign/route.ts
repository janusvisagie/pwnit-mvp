export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPwnit2CampaignSnapshot } from "@/lib/pwnit2CampaignServer";

export async function GET() {
  try {
    const { snapshot, leaderboard } = await getPwnit2CampaignSnapshot({ includeActor: true });
    return NextResponse.json({ ok: true, campaign: snapshot, leaderboard });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to load campaign." }, { status: 500 });
  }
}
