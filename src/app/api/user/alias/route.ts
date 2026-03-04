import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";

function normalizeAlias(raw: string) {
  return raw.trim().replace(/\s+/g, "_");
}

function isValidAlias(raw: string) {
  return /^[a-zA-Z0-9_]{3,16}$/.test(raw);
}

export async function POST(req: Request) {
  const user = await getOrCreateDemoUser();

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const aliasRaw = String(body?.alias ?? "");
  const alias = normalizeAlias(aliasRaw);

  if (!isValidAlias(alias)) {
    return NextResponse.json(
      { ok: false, error: "Alias must be 3–16 chars, letters/numbers/underscore only." },
      { status: 400 }
    );
  }

  // Check unique
  const exists = await prisma.user.findFirst({
    where: { alias, NOT: { id: user.id } },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json({ ok: false, error: "That alias is already taken." }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { alias, aliasSetByUser: true, isGuest: true },
    select: { id: true, alias: true, aliasSetByUser: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
