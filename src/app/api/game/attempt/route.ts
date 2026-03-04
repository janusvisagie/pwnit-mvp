import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateDemoUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
import { spendCredits, getCreditBalance } from "@/lib/credits";
import { flagAttempt, flagsToString } from "@/lib/antiCheat";
import { costCreditsForTier } from "@/lib/pricing";

const Body = z.object({
  itemId: z.string().min(1),
  scoreMs: z.number().int().min(0).max(10000),
  rttMs: z.number().int().min(0).max(5000),
  clientSentAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const user = await getOrCreateDemoUser();
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { itemId, scoreMs, rttMs, clientSentAt } = parsed.data;

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "item_not_found" }, { status: 404 });

  // Cost is derived from item tier
  const costCredits = costCreditsForTier(item.tier);

  // Spend credits (throws if insufficient)
  try {
    await spendCredits(user.id, costCredits, `attempt:${itemId}`, "ATTEMPT_SPEND");
  } catch {
    return NextResponse.json(
      { error: "insufficient_credits", costCredits },
      { status: 402 }
    );
  }

  const dayKey = dayKeyZA();
  const flags = flagsToString(flagAttempt({ scoreMs, rttMs }));

  await prisma.attempt.create({
    data: {
      userId: user.id,
      itemId,
      dayKey,
      scoreMs,
      flags,
      clientSentAt: clientSentAt ? new Date(clientSentAt) : null,
      // This will stay false unless/until you implement “buy credits” + paid purchases.
      isPaid: false,
    },
  });

  const best = await prisma.attempt.findFirst({
    where: { userId: user.id, itemId, dayKey },
    orderBy: [{ scoreMs: "asc" }, { createdAt: "asc" }],
    select: { scoreMs: true },
  });

  const balance = await getCreditBalance(user.id);

  return NextResponse.json({
    ok: true,
    costCredits,
    bestScoreMs: best?.scoreMs ?? null,
    balance,
  });
}
