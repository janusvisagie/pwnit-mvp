export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { searchLedger } from "@/lib/adminCampaign";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const url = new URL(req.url);
    const rows = await searchLedger({
      ledger: url.searchParams.get("ledger") === "discount" ? "discount" : "credit",
      user: url.searchParams.get("user") || undefined,
      itemId: url.searchParams.get("itemId") || undefined,
      roundId: url.searchParams.get("roundId") || undefined,
      kind: url.searchParams.get("kind") || undefined,
      limit: Number(url.searchParams.get("limit") || 50),
    });
    return NextResponse.json({ ok: true, rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "failed" }, { status: 500 });
  }
}
