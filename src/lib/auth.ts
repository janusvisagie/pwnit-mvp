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

    try {
      await prisma.creditLedger.create({
        data: {
          userId: user.id,
          kind: "DAILY_FREE",
          credits: DAILY_FREE_CREDITS,
          note: `Initial daily free credits for ${today}`,
        },
      });
    } catch {}

    return user;
  }

  const lastKey = String((user as any).lastDailyCreditsDayKey ?? "");
  if (lastKey !== today) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          freeCreditsBalance: DAILY_FREE_CREDITS,
          lastDailyCreditsDayKey: today,
        } as any,
      });
      await tx.creditLedger.create({
        data: {
          userId: user.id,
          kind: "DAILY_FREE",
          credits: DAILY_FREE_CREDITS,
          note: `Daily free credits for ${today}`,
        },
      });
    });

    user = await prisma.user.findUnique({ where: { id: user.id } });
  }

  return user;
}
