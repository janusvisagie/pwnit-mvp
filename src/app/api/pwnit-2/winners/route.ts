export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public, read-only: recent rank-1 winners (alias + score + campaign title) for social proof.
export async function GET() {
  try {
    const rows = await prisma.winner.findMany({
      where: { rank: 1 },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { item: { select: { title: true, gameKey: true } } },
    });
    const winners = rows.map((w) => ({
      id: w.id,
      alias: (w.alias && w.alias.trim()) || "player",
      score: String(w.item?.gameKey ?? "").startsWith("pwnit2:")
        ? Math.max(0, 1_000_000 - Number(w.scoreMs || 0))
        : Number(w.scoreMs || 0),
      title: w.item?.title ?? "Voucher",
      when: w.createdAt,
    }));
    return NextResponse.json({ ok: true, winners });
  } catch {
    return NextResponse.json({ ok: false, winners: [] });
  }
}
