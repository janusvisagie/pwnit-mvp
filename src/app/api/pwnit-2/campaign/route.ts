export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPwnit2CampaignSnapshot, listPwnit2Campaigns } from "@/lib/pwnit2CampaignServer";

// GET /api/pwnit-2/campaign            -> { ok, campaigns: [{slug, campaign, leaderboard}] }
// GET /api/pwnit-2/campaign?item=hero  -> { ok, slug, campaign, leaderboard }
export async function GET(req: Request) {
  try {
    const item = new URL(req.url).searchParams.get("item");
    if (item) {
      const { snapshot, leaderboard } = await getPwnit2CampaignSnapshot({ slug: item, includeActor: true });
      return NextResponse.json({ ok: true, slug: snapshot.slug, campaign: snapshot, leaderboard });
    }
    const { campaigns } = await listPwnit2Campaigns({ includeActor: true });
    return NextResponse.json({ ok: true, campaigns });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to load campaigns." }, { status: 500 });
  }
}
