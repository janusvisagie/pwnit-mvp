export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCurrentActor } from "@/lib/auth";
import {
  subscriptionPlan,
  getActiveSubscription,
  createSubscription,
  cancelSubscription,
} from "@/lib/subscriptions";

export async function GET() {
  const actor = await getCurrentActor();
  const plan = subscriptionPlan();
  if (actor.isGuest) return NextResponse.json({ ok: true, plan, subscription: null, guest: true });
  const subscription = await getActiveSubscription(actor.user.id);
  return NextResponse.json({ ok: true, plan, subscription });
}

export async function POST(req: Request) {
  try {
    const actor = await getCurrentActor();
    if (actor.isGuest) {
      return NextResponse.json({ ok: false, error: "Please sign in to subscribe." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const action = String((body as { action?: unknown })?.action ?? "subscribe");
    if (action === "cancel") {
      await cancelSubscription(actor.user.id);
      return NextResponse.json({ ok: true, cancelled: true });
    }
    // Phase 1: no payment is taken. Phase 2 will gate this on a confirmed charge.
    const subscription = await createSubscription(actor.user.id);
    return NextResponse.json({ ok: true, subscription });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Subscription failed." }, { status: 500 });
  }
}
