export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { grantSubscriptionCycle, getActiveSubscription } from "@/lib/subscriptions";

// Phase-1 testing hook: force-grant a subscription cycle (credits to the wallet) by
// subscriptionId or by the subscriber's email. Admin-gated. Real grants come from the
// billing webhook in Phase 2.
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    let subscriptionId = String((body as { subscriptionId?: unknown })?.subscriptionId ?? "").trim();
    const email = String((body as { email?: unknown })?.email ?? "").trim().toLowerCase();
    if (!subscriptionId && email) {
      const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
      if (!user) return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
      const sub = await getActiveSubscription(user.id);
      if (!sub) return NextResponse.json({ ok: false, error: "no_active_subscription" }, { status: 404 });
      subscriptionId = sub.id;
    }
    if (!subscriptionId) {
      return NextResponse.json({ ok: false, error: "subscriptionId_or_email_required" }, { status: 400 });
    }
    const result = await grantSubscriptionCycle(subscriptionId, { force: true });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "grant_failed" }, { status: 500 });
  }
}
