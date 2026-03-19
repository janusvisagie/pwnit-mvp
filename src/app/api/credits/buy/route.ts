export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getCurrentActor } from "@/lib/auth";
import { prisma } from "@/lib/db";

const BUNDLE_CREDITS: Record<string, number> = {
  starter: 30,
  value: 80,
  max: 150,
};

export async function POST(req: Request) {
  try {
    const actor = await getCurrentActor();
    const body = await req.json().catch(() => ({}));
    const bundleKey = String((body as { bundleKey?: unknown })?.bundleKey || "").trim().toLowerCase();
    const creditsToAdd = BUNDLE_CREDITS[bundleKey];

    if (!creditsToAdd) {
      return NextResponse.json({ ok: false, error: "Unknown bundle." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: actor.user.id },
      data: {
        paidCreditsBalance: {
          increment: creditsToAdd,
        } as any,
      } as any,
      select: {
        freeCreditsBalance: true,
        paidCreditsBalance: true,
      },
    });

    return NextResponse.json({
      ok: true,
      actorLabel: actor.user.alias || (actor.isGuest ? "Playing as Guest" : actor.user.email),
      added: creditsToAdd,
      freeCreditsBalance: Number((updated as any).freeCreditsBalance ?? 0),
      paidCreditsBalance: Number((updated as any).paidCreditsBalance ?? 0),
      totalCredits:
        Number((updated as any).freeCreditsBalance ?? 0) + Number((updated as any).paidCreditsBalance ?? 0),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Could not add credits." },
      { status: 500 },
    );
  }
}
