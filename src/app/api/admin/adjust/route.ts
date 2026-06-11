export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getCurrentActor } from "@/lib/auth";
import { adjustUserCredits, adjustUserDiscount, type AdminMeta } from "@/lib/adminCampaign";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const actor = await getCurrentActor();
    const meta: AdminMeta = {
      adminUserId: actor.user.id,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: req.headers.get("user-agent"),
    };
    const body = await req.json().catch(() => ({}));
    if (body?.kind === "discount") {
      return NextResponse.json(await adjustUserDiscount(meta, body));
    }
    return NextResponse.json(await adjustUserCredits(meta, body));
  } catch (error: any) {
    const msg = error?.message || "failed";
    const status = ["reason_required", "delta_required", "user_required", "user_not_found", "item_required", "would_go_negative"].includes(msg) ? 400 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
