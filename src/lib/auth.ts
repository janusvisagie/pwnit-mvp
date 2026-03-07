// src/lib/auth.ts
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
import { cookies, headers } from "next/headers";

export const DAILY_FREE_CREDITS = 30;

const COOKIE_KEYS = [
  "pwnit_demo",
  "pwnit_demo_user",
  "demo",
  "demoUser",
  "demo_user",
  "justskill_demo",
];

function normalizeDemoId(raw: string | null | undefined) {
  const s = String(raw ?? "").trim().toLowerCase();
  const m = s.match(/^demo\d+$/);
  return m ? m[0] : null;
}

function getDemoIdFromRequest(): string {
  try {
    const jar = cookies();
    for (const key of COOKIE_KEYS) {
      const v = jar.get(key)?.value;
      const id = normalizeDemoId(v);
      if (id) return id;
    }
  } catch {}

  try {
    const h = headers();
    const id = normalizeDemoId(h.get("x-demo-user"));
    if (id) return id;
  } catch {}

  return "demo1";
}

export async function getOrCreateDemoUser() {
  const demoId = getDemoIdFromRequest();
  const demoEmail = `${demoId}@maketiyours.local`;
  const today = dayKeyZA();

  let user: any = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: demoEmail,
        referralCode: "demo",
        isGuest: true,
        freeCreditsBalance: DAILY_FREE_CREDITS,
        lastDailyCreditsDayKey: today,
      } as any,
    });
    return user;
  }

  const lastKey = String((user as any).lastDailyCreditsDayKey ?? "");
  if (lastKey !== today) {
    const res = await prisma.user.updateMany({
      where: {
        id: user.id,
        NOT: { lastDailyCreditsDayKey: today as any },
      } as any,
      data: {
        freeCreditsBalance: DAILY_FREE_CREDITS,
        lastDailyCreditsDayKey: today,
      } as any,
    });

    user = await prisma.user.findUnique({ where: { id: user.id } });
    if (!user && res.count > 0) {
      user = await prisma.user.findUnique({ where: { email: demoEmail } });
    }
  }

  return user;
}
