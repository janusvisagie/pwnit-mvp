export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPwnit2PurchaseView, confirmPwnit2Purchase } from "@/lib/pwnit2CampaignServer";

function slugFrom(value: string | null | undefined) {
  return value === "staple" ? "staple" : "hero";
}

// GET /api/pwnit-2/purchase?item=hero -> voucher value + your discount + payable + canBuy.
export async function GET(req: Request) {
  try {
    const slug = slugFrom(new URL(req.url).searchParams.get("item"));
    const snapshot = await getPwnit2PurchaseView(slug);
    return NextResponse.json({ ok: true, campaign: snapshot, purchase: snapshot.purchase });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to load purchase details." }, { status: 500 });
  }
}

// POST { slug } -> confirm a (test) purchase, applying your campaign discount.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const slug = slugFrom(body?.slug);
    const result = await confirmPwnit2Purchase(slug);
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
    return NextResponse.json({ ok: false, error: error?.message || "Unable to complete purchase." }, { status: 500 });
  }
}
