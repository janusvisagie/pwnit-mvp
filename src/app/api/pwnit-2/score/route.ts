export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCurrentActor } from "@/lib/auth";
import { submitPwnit2Score } from "@/lib/pwnit2CampaignServer";
import { verifyPlayToken } from "@/lib/pwnit2PlayToken";
import { validateRun, scoreFromRun } from "@/lib/pwnit2Puzzle";

// POST /api/pwnit-2/score
// Body: { token, slug, taps: number[], elapsedMs, rttMs }
// The client never sends a trusted score. We verify the signed seed (bound to user + slug),
// re-derive the sequence, count the correct tap prefix, and compute the score ourselves.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const token = String(body?.token ?? "");
    const slug = body?.slug === "staple" ? "staple" : "hero";
    const taps = Array.isArray(body?.taps)
      ? body.taps.map((x: any) => (x === null || x === undefined ? null : Number(x)))
      : null;
    const elapsedMs = Math.max(0, Math.floor(Number(body?.elapsedMs ?? 0)));
    const rttMs = Math.max(0, Math.min(5000, Math.floor(Number(body?.rttMs ?? 0))));

    if (!token || !taps) {
      return NextResponse.json({ ok: false, error: "Please refresh to start a new game." }, { status: 400 });
    }

    const actor = await getCurrentActor();
    const verified = verifyPlayToken(token, actor.user.id, slug);
    if (!verified.ok || verified.seed === undefined) {
      return NextResponse.json({ ok: false, error: "This game session has expired — start a new round." }, { status: 400 });
    }

    const { roundsCleared } = validateRun(verified.seed, taps);
    const score = scoreFromRun(roundsCleared, elapsedMs);

    const result = await submitPwnit2Score({
      slug,
      score,
      elapsedSeconds: Math.floor(elapsedMs / 1000),
      correct: roundsCleared,
      total: roundsCleared,
      rttMs,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          needCredits: (result as { needCredits?: boolean }).needCredits ?? false,
          playCostCredits: (result as { playCostCredits?: number }).playCostCredits ?? null,
          campaign: result.snapshot,
          leaderboard: result.leaderboard,
        },
        { status: result.status },
      );
    }

    return NextResponse.json({
      ok: true,
      roundsCleared,
      campaign: result.snapshot,
      leaderboard: result.leaderboard,
      myRank: result.myRank,
      discountEarnedZAR: result.discountEarnedZAR,
      creditsSpent: result.creditsSpent,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to save score." }, { status: 500 });
  }
}
