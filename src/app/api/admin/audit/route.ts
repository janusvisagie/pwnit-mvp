export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listArchiveSnapshots, listAuditLog } from "@/lib/adminCampaign";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("view") === "snapshots") {
      return NextResponse.json({ ok: true, snapshots: await listArchiveSnapshots() });
    }
    const rows = await listAuditLog({
      limit: Number(url.searchParams.get("limit") || 100),
      entityType: url.searchParams.get("entityType") || undefined,
      entityId: url.searchParams.get("entityId") || undefined,
    });
    return NextResponse.json({ ok: true, rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "failed" }, { status: 500 });
  }
}
