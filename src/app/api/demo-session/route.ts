import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // if this import fails, tell me the error

export async function POST() {
  const u = await prisma.user.findUnique({
    where: { email: "demo@local.test" },
    select: { id: true },
  });

  if (!u) {
    return NextResponse.json(
      { ok: false, error: "Demo user missing. Run db:seed." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set("mvp_user", u.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
