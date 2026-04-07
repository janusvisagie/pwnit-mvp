export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCurrentActor, getRequestIp, hashForRateLimit } from "@/lib/auth";
import { shouldRequireTurnstileForCompetitiveStart } from "@/lib/botRisk";
import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rateLimit";
import { ensureCurrentRound, syncRoundLifecycle } from "@/lib/rounds";
import { buildVerifiedChallenge, isVerifiedGameKey } from "@/lib/verifiedGames";
import { validateTurnstileToken } from "@/lib/turnstile";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const itemId = String(body?.itemId || "").trim();
    const turnstileToken = String(body?.turnstileToken || "").trim() || null;

    if (!itemId) {
      return NextResponse.json({ ok: false, error: "Missing itemId" }, { status: 400 });
    }

    const actor = await getCurrentActor();
    const user = actor.user;
    const subject = `${user.id}:${actor.bucketKey}:${hashForRateLimit(getRequestIp())}:${itemId}`;

    const rate = await consumeRateLimit({
      scope: "attempt_start",
      subject,
      limit: 10,
      windowMs: 5 * 60 * 1000,
    });

    if (!rate.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many start requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, title: true, gameKey: true },
    });

    if (!item) {
      return NextResponse.json({ ok: false, error: "Item not found" }, { status: 404 });
    }

    const gameKey = item.gameKey;
    if (!gameKey || !isVerifiedGameKey(gameKey)) {
      return NextResponse.json(
        {
          ok: false,
          error: "This game is not on the new server-verified flow yet. Re-seed to the puzzle-first mix first.",
        },
        { status: 409 },
      );
    }

    const turnstileRequirement = await shouldRequireTurnstileForCompetitiveStart({
      userId: user.id,
      itemId,
    });

    if (turnstileRequirement.required) {
      const humanCheck = await validateTurnstileToken({ token: turnstileToken, remoteIp: getRequestIp() });

      if (!humanCheck.ok) {
        return NextResponse.json(
          {
            ok: false,
            error:
              turnstileRequirement.reason === "first_competitive_play"
                ? "Please complete the human check before your first competitive play."
                : "Please complete the human check before continuing. We noticed unusually rapid play-start behaviour.",
            turnstileRequired: true,
            reason: turnstileRequirement.reason,
          },
          { status: 403 },
        );
      }
    }

    const round = await ensureCurrentRound(itemId);
    if (!round) {
      return NextResponse.json({ ok: false, error: "Round not found" }, { status: 404 });
    }

    const synced = await syncRoundLifecycle(itemId);
    const currentState = synced?.state ?? round.state;

    if (!["BUILDING", "ACTIVATED"].includes(currentState)) {
      return NextResponse.json({ ok: false, error: "This prize is not accepting plays right now." }, { status: 409 });
    }

    const challenge = buildVerifiedChallenge(gameKey);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await (prisma as any).attemptSession.updateMany({
      where: {
        userId: user.id,
        itemId,
        roundId: round.id,
        status: "ISSUED",
      },
      data: {
        status: "EXPIRED",
        verificationJson: { reason: "superseded_by_new_session" },
      },
    });

    const session = await (prisma as any).attemptSession.create({
      data: {
        userId: user.id,
        itemId,
        roundId: round.id,
        gameKey,
        status: "ISSUED",
        challengeJson: challenge,
        expiresAt,
      },
      select: { id: true, expiresAt: true },
    });

    return NextResponse.json({
      ok: true,
      attemptId: session.id,
      challenge,
      expiresAt: session.expiresAt,
      antiBot: {
        turnstileRequired: turnstileRequirement.required,
        reason: turnstileRequirement.reason,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) || "Server error" }, { status: 500 });
  }
}
