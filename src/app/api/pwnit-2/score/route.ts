export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCurrentActor } from "@/lib/auth";
import { submitPwnit2Score } from "@/lib/pwnit2CampaignServer";
import { verifyPlayToken } from "@/lib/pwnit2PlayToken";
import { validateGauntletRun, scoreFromRun } from "@/lib/pwnit2Gauntlet";

// POST /api/pwnit-2/score
// Body: { token, slug, rounds: number[][], elapsedMs, rttMs }
// rounds[i] = the player's taps for round i (memory pad indices, or grid cell indices).
// The server re-derives every round from the signed seed (bound to user + slug), counts
// the leading fully-cleared rounds, and computes the score itself — the client score is
// never trusted.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const token = String(body?.token ?? "");
    const slug = body?.slug === "staple" ? "staple" : "hero";
    const rounds = Array.isArray(body?.rounds)
      ? body.rounds.map((r: any) =>
          Array.isArray(r) ? r.map((x: any) => (x === null || x === undefined ? null : Number(x))) : [],
        )
      : null;
    const elapsedMs = Math.max(0, Math.floor(Number(body?.elapsedMs ?? 0)));
    const rttMs = Math.max(0, Math.min(5000, Math.floor(Number(body?.rttMs ?? 0))));

    if (!token || !rounds) {
      return NextResponse.json({ ok: false, error: "Please refresh to start a new game." }, { status: 400 });
    }

    const actor = await getCurrentActor();
    const verified = verifyPlayToken(token, actor.user.id, slug);
    if (!verified.ok || verified.seed === undefined) {
      return NextResponse.json({ ok: false, error: "This game session has expired — start a new round." }, { status: 400 });
    }

    const { roundsCleared } = validateGauntletRun(verified.seed, rounds);
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
