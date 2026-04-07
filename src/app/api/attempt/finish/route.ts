
export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getCurrentActor, getRequestIp, hashForRateLimit } from "@/lib/auth";
import { evaluateCompetitiveAttemptRisk } from "@/lib/botRisk";
import { prisma } from "@/lib/db";
import { compareScores } from "@/lib/gameRules";
import { playCostForPrize } from "@/lib/playCost";
import { consumeRateLimit } from "@/lib/rateLimit";
import { ensureCurrentRound, syncRoundLifecycle } from "@/lib/rounds";
import { isVerifiedGameKey, verifyVerifiedAttempt } from "@/lib/verifiedGames";
import { dayKeyZA } from "@/lib/time";

const INVALID_FLAG_FRAGMENT = '"valid":false';

function isInvalidAttempt(flags: string | null | undefined) {
  if (!flags) return false;
  return flags.includes(INVALID_FLAG_FRAGMENT);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const attemptId = String(body?.attemptId || "").trim();
    const meta = body?.meta && typeof body.meta === "object" ? body.meta : {};

    if (!attemptId) {
      return NextResponse.json({ ok: false, error: "Missing attemptId" }, { status: 400 });
    }

    const actor = await getCurrentActor();
    const user = actor.user;
    const subject = `${user.id}:${actor.bucketKey}:${hashForRateLimit(getRequestIp())}:${attemptId}`;
    const rate = await consumeRateLimit({
      scope: "attempt_finish",
      subject,
      limit: 16,
      windowMs: 5 * 60 * 1000,
    });

    if (!rate.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many finish requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    const session = await (prisma as any).attemptSession.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        userId: true,
        itemId: true,
        roundId: true,
        gameKey: true,
        status: true,
        challengeJson: true,
        issuedAt: true,
        expiresAt: true,
      },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ ok: false, error: "Attempt session not found" }, { status: 404 });
    }

    if (session.status !== "ISSUED") {
      return NextResponse.json({ ok: false, error: "This attempt session is no longer active." }, { status: 409 });
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await (prisma as any).attemptSession.update({
        where: { id: session.id },
        data: { status: "EXPIRED", verificationJson: { reason: "expired_before_finish" } },
      });
      return NextResponse.json({ ok: false, error: "This attempt session expired. Start a new run." }, { status: 409 });
    }

    if (!isVerifiedGameKey(session.gameKey)) {
      return NextResponse.json({ ok: false, error: "Unsupported game for verified finish flow." }, { status: 409 });
    }

    const item = await prisma.item.findUnique({
      where: { id: session.itemId },
      select: { id: true, prizeValueZAR: true, playCostCredits: true, gameKey: true },
    });
    if (!item) {
      return NextResponse.json({ ok: false, error: "Item not found" }, { status: 404 });
    }

    const round = await ensureCurrentRound(session.itemId);
    if (!round || round.id !== session.roundId) {
      return NextResponse.json({ ok: false, error: "Round changed. Start a fresh run." }, { status: 409 });
    }

    const synced = await syncRoundLifecycle(session.itemId);
    const currentState = synced?.state ?? round.state;
    if (!["BUILDING", "ACTIVATED"].includes(currentState)) {
      return NextResponse.json({ ok: false, error: "This prize is not accepting plays right now." }, { status: 409 });
    }

    const serverElapsedMs = Math.max(0, Date.now() - new Date(session.issuedAt).getTime());
    const verification = verifyVerifiedAttempt(session.gameKey, session.challengeJson as any, meta, serverElapsedMs);

    if (!verification.valid) {
      await (prisma as any).attemptSession.update({
        where: { id: session.id },
        data: { status: "REJECTED", submittedAt: new Date(), verificationJson: verification.flags },
      });
      return NextResponse.json(
        { ok: false, error: "Attempt rejected by server verification.", flags: verification.flags },
        { status: 422 },
      );
    }

    const risk = await evaluateCompetitiveAttemptRisk({
      request: req,
      gameKey: session.gameKey,
      userId: user.id,
      itemId: session.itemId,
      meta,
      verificationFlags: verification.flags,
      serverElapsedMs,
    });

    const dayKey = dayKeyZA();
    const playCost = playCostForPrize(item.prizeValueZAR);

    const txRes = await prisma.$transaction(async (tx) => {
      const freshUser: any = await tx.user.findUnique({
        where: { id: user.id },
        select: { id: true, paidCreditsBalance: true, freeCreditsBalance: true },
      });

      const freeBal = Number(freshUser?.freeCreditsBalance ?? 0);
      const paidBal = Number(freshUser?.paidCreditsBalance ?? 0);
      const totalBal = freeBal + paidBal;
      if (totalBal < playCost) {
        return {
          ok: false as const,
          error: "Not enough credits",
          playCost,
          freeBalance: freeBal,
          paidBalance: paidBal,
          totalBalance: totalBal,
        };
      }

      const freeUsed = Math.min(playCost, freeBal);
      const paidUsed = Math.max(0, playCost - freeUsed);
      const newFree = freeBal - freeUsed;
      const newPaid = paidBal - paidUsed;

      await tx.user.update({
        where: { id: user.id },
        data: { freeCreditsBalance: newFree, paidCreditsBalance: newPaid } as any,
      });

      const flagsPayload = {
        valid: true,
        verified: true,
        verification: verification.flags,
        challengeType: session.gameKey,
        sessionId: session.id,
        risk,
      };
      const flags = JSON.stringify(flagsPayload).slice(0, 2000);

      const attempt = await tx.attempt.create({
        data: {
          userId: user.id,
          itemId: session.itemId,
          roundId: round.id,
          dayKey,
          costCredits: playCost,
          freeUsed,
          paidUsed,
          isPaid: paidUsed > 0,
          scoreMs: Math.max(0, Math.floor(verification.scoreMs)),
          flags,
        } as any,
        select: { id: true },
      });

      await tx.itemRound.update({
        where: { id: round.id },
        data: {
          attemptCount: { increment: 1 },
          paidCreditsCollected: { increment: paidUsed },
          freeCreditsCollected: { increment: freeUsed },
        },
      });

      if (paidUsed > 0) {
        await tx.creditLedger.create({
          data: {
            userId: user.id,
            itemId: session.itemId,
            roundId: round.id,
            kind: "PLAY_DEBIT_PAID",
            credits: -paidUsed,
            note: `Paid verified play on ${session.itemId}`,
          },
        });
      }
      if (freeUsed > 0) {
        await tx.creditLedger.create({
          data: {
            userId: user.id,
            itemId: session.itemId,
            roundId: round.id,
            kind: "PLAY_DEBIT_FREE",
            credits: -freeUsed,
            note: `Free verified play on ${session.itemId}`,
          },
        });
      }

      await (tx as any).attemptSession.update({
        where: { id: session.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          verificationJson: {
            scoreMs: verification.scoreMs,
            ...verification.flags,
            risk,
            attemptRowId: attempt.id,
          },
        },
      });

      return {
        ok: true as const,
        playCost,
        freeUsed,
        paidUsed,
        freeBalance: newFree,
        paidBalance: newPaid,
        totalBalance: newFree + newPaid,
        flags,
        officialScore: verification.scoreMs,
        reviewRequired: risk.reviewRequired,
        risk,
      };
    });

    if (!txRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: txRes.error,
          playCost: txRes.playCost,
          freeBalance: txRes.freeBalance,
          paidBalance: txRes.paidBalance,
          totalBalance: txRes.totalBalance,
        },
        { status: 402 },
      );
    }

    await syncRoundLifecycle(session.itemId);

    const rowsRaw = await prisma.attempt.findMany({
      where: {
        itemId: session.itemId,
        roundId: round.id,
        OR: [{ flags: null }, { NOT: { flags: { contains: INVALID_FLAG_FRAGMENT } } }],
      },
      orderBy: [{ createdAt: "asc" }],
      select: { userId: true, scoreMs: true, createdAt: true },
    });

    const bestByUser = new Map();
    for (const row of rowsRaw as any[]) {
      const current = bestByUser.get(row.userId);
      if (!current || compareScores(item.gameKey, row, current) < 0) {
        bestByUser.set(row.userId, row);
      }
    }

    const rows = Array.from(bestByUser.values()).sort((a, b) => compareScores(item.gameKey, a, b));
    const totalPlayers = rows.length;
    const myRank = totalPlayers ? Math.max(1, rows.findIndex((r) => r.userId === user.id) + 1) : 0;
    let status: "LEADING" | "BONUS" | "CHASING" = "CHASING";
    if (myRank === 1) status = "LEADING";
    else if (myRank === 2 || myRank === 3) status = "BONUS";

    const refreshedRound = await prisma.itemRound.findUnique({ where: { id: round.id } });
    const attemptInvalid = isInvalidAttempt(txRes.flags);

    return NextResponse.json({
      ok: true,
      playCost: txRes.playCost,
      freeUsed: txRes.freeUsed,
      paidUsed: txRes.paidUsed,
      freeBalance: txRes.freeBalance,
      paidBalance: txRes.paidBalance,
      totalBalance: txRes.totalBalance,
      officialScore: txRes.officialScore,
      attemptInvalid,
      myRank,
      totalPlayers,
      status,
      roundState: refreshedRound?.state ?? currentState,
      reviewRequired: txRes.reviewRequired,
      risk: txRes.risk,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) || "Server error" }, { status: 500 });
  }
}
