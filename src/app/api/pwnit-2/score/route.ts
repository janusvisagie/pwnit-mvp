export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { submitPwnit2Score } from "@/lib/pwnit2CampaignServer";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await submitPwnit2Score({
      score: Number(body?.score ?? 0),
      elapsedSeconds: Number(body?.elapsedSeconds ?? 0),
      correct: Number(body?.correct ?? 0),
      total: Number(body?.total ?? 1),
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error, campaign: result.snapshot, leaderboard: result.leaderboard }, { status: result.status });
    }

    return NextResponse.json({ ok: true, campaign: result.snapshot, leaderboard: result.leaderboard, myRank: result.myRank });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to save score." }, { status: 500 });
  }
}
