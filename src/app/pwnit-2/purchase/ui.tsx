"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Pwnit2CampaignSnapshot, Pwnit2PurchaseQuote } from "@/lib/pwnit2DemoCampaign";

type PurchasePayload = {
  ok: boolean;
  campaign?: Pwnit2CampaignSnapshot;
  purchase?: Pwnit2PurchaseQuote | null;
  error?: string;
};

type ConfirmPayload = {
  ok: boolean;
  voucherCode?: string;
  voucherValueZAR?: number;
  discountAppliedZAR?: number;
  paidZAR?: number;
  error?: string;
};

type Receipt = {
  voucherCode: string;
  voucherValueZAR: number;
  discountAppliedZAR: number;
  paidZAR: number;
};

export default function Pwnit2Purchase({ slug = "hero" }: { slug?: string }) {
  const campaignSlug = slug === "staple" ? "staple" : "hero";
  const q = `?item=${campaignSlug}`;
  const [campaign, setCampaign] = useState<Pwnit2CampaignSnapshot | null>(null);
  const [quote, setQuote] = useState<Pwnit2PurchaseQuote | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  async function loadQuote() {
    try {
      const res = await fetch(`/api/pwnit-2/purchase?item=${campaignSlug}`, { cache: "no-store" });
      const data = (await res.json()) as PurchasePayload;
      if (data.ok) {
        setCampaign(data.campaign ?? null);
        setQuote(data.purchase ?? null);
      } else {
        setError(data.error || "Could not load purchase details.");
      }
    } catch {
      setError("Could not load purchase details.");
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    loadQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignSlug]);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/pwnit-2/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: campaignSlug }),
      });
      const data = (await res.json()) as ConfirmPayload;
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not complete the purchase.");
        loadQuote();
        return;
      }
      setReceipt({
        voucherCode: data.voucherCode || "—",
        voucherValueZAR: Number(data.voucherValueZAR ?? 0),
        discountAppliedZAR: Number(data.discountAppliedZAR ?? 0),
        paidZAR: Number(data.paidZAR ?? 0),
      });
    } catch {
      setError("Could not complete the purchase.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-[2rem] border border-[#e6ded9] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            {campaign?.title ?? "R1,000 Shopping Voucher"}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Buy the voucher</h1>
          {campaign?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campaign.imageUrl}
              alt={`${campaign.title} voucher`}
              className="mt-4 w-full max-w-sm rounded-2xl border border-[#e6ded9] shadow-sm"
            />
          ) : null}
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
            Your paid plays became discount on this voucher. Apply it here to buy at the final value minus
            your discount.
          </p>
        </div>

        {receipt ? (
          <div className="rounded-[2rem] border border-emerald-300 bg-emerald-50 p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Purchase complete</p>
            <h2 className="mt-2 text-2xl font-black text-emerald-900">Voucher {receipt.voucherCode}</h2>
            <div className="mt-4 space-y-2 text-sm font-bold text-emerald-900">
              <Row label="Voucher value" value={`R${receipt.voucherValueZAR}`} />
              <Row label="Discount applied" value={`−R${receipt.discountAppliedZAR}`} />
              <Row label="You paid" value={`R${receipt.paidZAR}`} strong />
            </div>
            <p className="mt-4 text-xs font-semibold text-emerald-800">
              This is a test purchase — no real payment was taken.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-full bg-[#0f172a] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]"
            >
              Back to campaign
            </Link>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[#e6ded9] bg-white p-6 shadow-sm sm:p-8">
            {!loaded ? (
              <p className="text-sm font-bold text-slate-500">Loading your quote…</p>
            ) : quote?.isWinnerYou ? (
              <Notice
                tone="good"
                title="You won this voucher 🎉"
                body="Your score took the top spot, so the voucher is yours — there's nothing to buy."
              />
            ) : quote?.alreadyPurchased ? (
              <Notice
                tone="good"
                title="Already purchased"
                body="You've already bought this voucher. Check your account for the voucher code."
              />
            ) : !quote?.canBuy ? (
              <Notice
                tone="muted"
                title="Not available right now"
                body="The voucher can be bought during the countdown and the post-closure window. The window may not be open yet, or it may have closed."
              />
            ) : (
              <div className="space-y-5">
                <div className="space-y-2 text-sm font-bold text-slate-800">
                  <Row label="Voucher value" value={`R${quote.voucherValueZAR}`} />
                  <Row label="Your discount" value={`−R${quote.yourDiscountZAR - (quote.podiumBonusZAR ?? 0)}`} />
                  {quote.podiumBonusZAR ? (
                    <Row label={`Podium bonus (rank ${quote.podiumRank})`} value={`−R${quote.podiumBonusZAR}`} />
                  ) : null}
                  <div className="my-2 h-px bg-[#e6ded9]" />
                  <Row label="Payable" value={`R${quote.payableZAR}`} strong />
                  <p className="pt-1 text-xs font-semibold text-slate-500">
                    From wallet credits: R{quote.walletAppliedZAR}
                    {quote.topUpZAR > 0 ? ` · top-up needed: R${quote.topUpZAR}` : ""}
                  </p>
                </div>

                {error ? (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={confirm}
                    disabled={pending}
                    className={[
                      "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-black transition",
                      pending
                        ? "bg-slate-200 text-slate-500"
                        : "bg-emerald-600 text-white hover:-translate-y-0.5 hover:bg-emerald-700",
                    ].join(" ")}
                  >
                    {pending ? "Processing…" : `Confirm · pay R${quote.payableZAR}`}
                  </button>
                  {quote.topUpZAR > 0 ? (
                    <Link
                      href="/buy-credits"
                      className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-black text-emerald-800 transition hover:-translate-y-0.5 hover:bg-white"
                    >
                      Add credits
                    </Link>
                  ) : null}
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  This is a test purchase — no real payment is taken.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/pwnit-2/result${q}`}
                className="rounded-full border border-[#e6ded9] bg-[#fffaf8] px-5 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
              >
                View result
              </Link>
              <Link
                href={`/play/pwnit-2${q}`}
                className="rounded-full border border-[#e6ded9] bg-[#fffaf8] px-5 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
              >
                Back to game
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "text-base" : ""}>{label}</span>
      <span className={strong ? "text-lg" : ""}>{value}</span>
    </div>
  );
}

function Notice({ tone, title, body }: { tone: "good" | "muted"; title: string; body: string }) {
  const cls =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <div className={`rounded-2xl border p-5 ${cls}`}>
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6">{body}</p>
    </div>
  );
}
