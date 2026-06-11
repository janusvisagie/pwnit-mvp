export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getCurrentActor } from "@/lib/auth";
import {
  createDraftCampaign,
  transitionRound,
  updateDraftCampaign,
  updateSnapshotNotes,
  type AdminMeta,
} from "@/lib/adminCampaign";

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
    const action = String(body?.action ?? "");

    if (action === "create_draft") {
      return NextResponse.json({ ok: true, ...(await createDraftCampaign(meta, body)) });
    }
    if (action === "update_draft") {
      return NextResponse.json(await updateDraftCampaign(meta, body));
    }
    if (action === "snapshot_notes") {
      return NextResponse.json(await updateSnapshotNotes(meta, body));
    }
    const result = await transitionRound(meta, {
      roundId: String(body?.roundId ?? ""),
      action,
      reason: body?.reason,
      hours: body?.hours,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    const msg = error?.message || "failed";
    const status = msg === "reason_required" || msg.startsWith("invalid_transition") || msg === "unknown_action" ? 400 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
