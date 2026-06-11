export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listAdminCampaigns } from "@/lib/adminCampaign";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json({ ok: true, items: await listAdminCampaigns() });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "failed" }, { status: 500 });
  }
}
