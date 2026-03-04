// src/app/api/attempt/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
import { getOrCreateDemoUser } from "@/lib/auth";
import { playCostForPrize } from "@/lib/playCost";

const CUTOFF_PCT = 5;

// Used by NumberMemory for "invalid but counts for activation"
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

    if (!itemId) return NextResponse.json({ ok: false, error: "Missing itemId" }, { status: 400 });
    if (!Number.isFinite(scoreMs)) {
      return NextResponse.json({ ok: false, error: "Invalid scoreMs" }, { status: 400 });
    }

    const user = await getOrCreateDemoUser();
    const dayKey = dayKeyZA();

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, prizeValueZAR: true },
    });
    if (!item) return NextResponse.json({ ok: false, error: "Item not found" }, { status: 404 });

    const playCost = playCostForPrize(item.prizeValueZAR);

    // Debit + attempt atomically
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

      // ✅ deduct free first, then paid
      const freeUsed = Math.min(playCost, freeBal);
      const remaining = playCost - freeUsed;
      const paidUsed = remaining;

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
          dayKey,

          // exact pricing attribution
          costCredits: playCost,
          freeUsed,
          paidUsed,
          isPaid: paidUsed > 0,

          scoreMs: Math.max(0, Math.floor(scoreMs)),
          flags,
        } as any,
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
        { status: 402 }
      );
    }

    // ✅ Live standings (exclude invalid attempts from leaderboard)
    const best = await prisma.attempt.groupBy({
      by: ["userId"],
      where: {
        itemId,
        dayKey,
        OR: [{ flags: null }, { NOT: { flags: { contains: INVALID_FLAG_FRAGMENT } } }],
      },
      _min: { scoreMs: true },
      orderBy: { _min: { scoreMs: "asc" } },
      take: 500,
    });

    const rows = best
      .filter((b) => typeof b._min.scoreMs === "number")
      .map((b) => ({ userId: b.userId, scoreMs: b._min.scoreMs as number }));

    const totalPlayers = rows.length;
    const myRank = totalPlayers ? Math.max(1, rows.findIndex((r) => r.userId === user.id) + 1) : 0;
    const cutoffRank = totalPlayers ? Math.max(1, Math.ceil((totalPlayers * CUTOFF_PCT) / 100)) : 0;

    const status =
      totalPlayers === 0
        ? "PLAYING"
        : myRank <= cutoffRank
        ? "WINNING"
        : myRank <= cutoffRank + 1
        ? "ALMOST"
        : "PLAYING";

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
      cutoffPct: CUTOFF_PCT,
      cutoffRank,
      status,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) || "Server error" }, { status: 500 });
  }
}
