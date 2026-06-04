export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPwnit2PurchaseView, confirmPwnit2Purchase } from "@/lib/pwnit2CampaignServer";

// GET: current voucher value + your discount + payable + whether you can buy.
export async function GET() {
  try {
    const snapshot = await getPwnit2PurchaseView();
    return NextResponse.json({ ok: true, campaign: snapshot, purchase: snapshot.purchase });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to load purchase details." },
      { status: 500 },
    );
  }
}

// POST: confirm a (test) purchase, applying your campaign discount.
export async function POST() {
  try {
    const result = await confirmPwnit2Purchase();
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      ok: true,
      voucherCode: result.voucherCode,
      voucherValueZAR: result.voucherValueZAR,
      discountAppliedZAR: result.discountAppliedZAR,
      paidZAR: result.paidZAR,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to complete purchase." },
      { status: 500 },
    );
  }
}
