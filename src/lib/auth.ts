// src/lib/auth.ts
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
import { cookies, headers } from "next/headers";

export const DAILY_FREE_CREDITS = 50;

/**
 * IMPORTANT:
 * Your DemoUserSwitcher / DemoSessionBootstrap must store the selected demo user in a cookie.
 * This helper tries several cookie keys to avoid mismatch.
 *
 * If your switcher uses a different cookie name, add it to COOKIE_KEYS below.
 */
const COOKIE_KEYS = [
  "pwnit_demo", // recommended
  "pwnit_demo_user",
  "demo",
  "demoUser",
  "demo_user",
  "justskill_demo",
];

function normalizeDemoId(raw: string | null | undefined) {
  const s = String(raw ?? "").trim().toLowerCase();
  // allow demo1..demo99 etc
  const m = s.match(/^demo\d+$/);
  return m ? m[0] : null;
}

function getDemoIdFromRequest(): string {
  // 1) Cookie (most common)
  try {
    const jar = cookies();
    for (const key of COOKIE_KEYS) {
      const v = jar.get(key)?.value;
      const id = normalizeDemoId(v);
      if (id) return id;
    }
  } catch {
    // ignore
  }

  // 2) Header fallback (useful for debugging / tests)
  try {
    const h = headers();
    const id = normalizeDemoId(h.get("x-demo-user"));
    if (id) return id;
  } catch {
    // ignore
  }

  // 3) Default
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

        // free credits: start today
        freeCreditsBalance: DAILY_FREE_CREDITS,
        lastDailyCreditsDayKey: today,
      } as any,
    });

    return user;
  }

  // ✅ NO ROLLOVER: reset free credits to DAILY_FREE_CREDITS on a new day
  if ((user as any).lastDailyCreditsDayKey !== today) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        freeCreditsBalance: DAILY_FREE_CREDITS,
        lastDailyCreditsDayKey: today,
      } as any,
    });
  }

  return user;
}
