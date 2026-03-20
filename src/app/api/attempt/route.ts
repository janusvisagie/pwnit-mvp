export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getCurrentActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compareScores } from "@/lib/gameRules";
import { playCostForPrize } from "@/lib/playCost";
import { ensureCurrentRound, syncRoundLifecycle } from "@/lib/rounds";
import { dayKeyZA } from "@/lib/time";

const INVALID_FLAG_FRAGMENT = '"valid":false';

function isInvalidAttempt(flags: string | null | undefined) {
  if (!flags) return false;
  return flags.includes(INVALID_FLAG_FRAGMENT);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const itemId = String(body?.itemId || "").trim();
    const scoreMs = Number(body?.scoreMs);

    if (!itemId) {
      return NextResponse.json({ ok: false, error: "Missing itemId" }, { status: 400 });
    }

    if (!Number.isFinite(scoreMs)) {
      return NextResponse.json({ ok: false, error: "Invalid score" }, { status: 400 });
    }

    const actor = await getCurrentActor();
    const user = actor.user;
    const dayKey = dayKeyZA();

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        prizeValueZAR: true,
        playCostCredits: true,
        gameKey: true,
      },
    });

    if (!item) {
      return NextResponse.json({ ok: false, error: "Item not found" }, { status: 404 });
    }

    const round = await ensureCurrentRound(itemId);
    if (!round) {
      return NextResponse.json({ ok: false, error: "Round not found" }, { status: 404 });
    }

    const synced = await syncRoundLifecycle(itemId);
    const currentState = synced?.state ?? round.state;

    if (!["BUILDING", "ACTIVATED"].includes(currentState)) {
      return NextResponse.json(
        { ok: false, error: "This prize is not accepting plays right now." },
        { status: 409 },
      );
    }

    const playCost = playCostForPrize(item.prizeValueZAR);

    const txRes = await prisma.$transaction(async (tx) => {
      const freshUser: any = await tx.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          paidCreditsBalance: true,
          freeCreditsBalance: true,
        },
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
        data: {
          freeCreditsBalance: newFree,
          paidCreditsBalance: newPaid,
        } as any,
      });

      const flags = body?.meta ? JSON.stringify(body.meta).slice(0, 2000) : null;

      await tx.attempt.create({
        data: {
          userId: user.id,
          itemId,
          roundId: round.id,
          dayKey,
          costCredits: playCost,
          freeUsed,
          paidUsed,
          isPaid: paidUsed > 0,
          scoreMs: Math.max(0, Math.floor(scoreMs)),
          flags,
        } as any,
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
            itemId,
            roundId: round.id,
            kind: "PLAY_DEBIT_PAID",
            credits: -paidUsed,
            note: `Paid play on ${itemId}`,
          },
        });
      }

      if (freeUsed > 0) {
        await tx.creditLedger.create({
          data: {
            userId: user.id,
            itemId,
            roundId: round.id,
            kind: "PLAY_DEBIT_FREE",
            credits: -freeUsed,
            note: `Free play on ${itemId}`,
          },
        });
      }

      return {
        ok: true as const,
        playCost,
        freeUsed,
        paidUsed,
        freeBalance: newFree,
        paidBalance: newPaid,
        totalBalance: newFree + newPaid,
        flags,
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

    await syncRoundLifecycle(itemId);

    const rowsRaw = await prisma.attempt.findMany({
      where: {
        itemId,
        roundId: round.id,
        OR: [{ flags: null }, { NOT: { flags: { contains: INVALID_FLAG_FRAGMENT } } }],
      },
      orderBy: [{ createdAt: "asc" }],
      select: {
        userId: true,
        scoreMs: true,
        createdAt: true,
      },
    });

    const bestByUser = new Map();
    for (const row of rowsRaw) {
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
      attemptInvalid,
      myRank,
      totalPlayers,
      status,
      roundState: refreshedRound?.state ?? currentState,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) || "Server error" },
      { status: 500 },
    );
  }
}
