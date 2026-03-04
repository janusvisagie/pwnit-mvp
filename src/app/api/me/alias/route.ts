// src/app/api/me/alias/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";

function cleanAlias(raw: any) {
  const s = String(raw ?? "").trim();
  // allow letters, numbers, underscore, dash, space
  const cleaned = s.replace(/[^a-zA-Z0-9_\- ]/g, "").slice(0, 24).trim();
  return cleaned;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const alias = cleanAlias(body?.alias);

    const me = await getOrCreateDemoUser();
    await prisma.user.update({
      where: { id: me.id },
      data: { alias } as any,
    });

    return NextResponse.json({ ok: true, alias });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
