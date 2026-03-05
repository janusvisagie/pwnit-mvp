// src/lib/auth.ts
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
import { cookies, headers } from "next/headers";

export const DAILY_FREE_CREDITS = 5;

/**
 * Demo user is selected via cookie.
 * This helper tries several cookie keys to avoid mismatch.
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
  const m = s.match(/^demo\d+$/);
  return m ? m[0] : null;
}

function getDemoIdFromRequest(): string {
  // 1) Cookie
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

  // 2) Header fallback
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

/**
 * Concurrency-safe daily free-credit reset:
 * - If the day rolled over, we reset exactly once using an atomic updateMany guard.
 * - This prevents multiple parallel requests from resetting (or racing) at the same time.
 */
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

  // Reset free credits once per day (atomic guard)
  const lastKey = String((user as any).lastDailyCreditsDayKey ?? "");
  if (lastKey !== today) {
    const res = await prisma.user.updateMany({
      where: {
        id: user.id,
        // only update if still on an older day
        NOT: { lastDailyCreditsDayKey: today as any },
      } as any,
      data: {
        freeCreditsBalance: DAILY_FREE_CREDITS,
        lastDailyCreditsDayKey: today,
      } as any,
    });

    if (res.count > 0) {
      user = await prisma.user.findUnique({ where: { id: user.id } });
    } else {
      // someone else already updated; re-read to keep response consistent
      user = await prisma.user.findUnique({ where: { id: user.id } });
    }
  }

  return user;
}
