// src/app/api/buy-credits/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";

const TOPUP = 30;

export async function POST() {
  const user = await getOrCreateDemoUser();

  await prisma.user.update({
    where: { id: user.id },
    data: { paidCreditsBalance: (user.paidCreditsBalance ?? 0) + TOPUP },
  });

  return NextResponse.json({ ok: true, added: TOPUP });
}
