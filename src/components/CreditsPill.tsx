"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

export function CreditsPill(props?: { free?: number; paid?: number }) {
  const pathname = usePathname();
  const usingProps = typeof props?.free === "number" || typeof props?.paid === "number";
  const [free, setFree] = useState<number | null>(typeof props?.free === "number" ? props.free : null);
  const [paid, setPaid] = useState<number | null>(typeof props?.paid === "number" ? props.paid : null);
  const [discount, setDiscount] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState<number | null>(null);

  const itemIdFromPath = useMemo(() => {
    const match = pathname?.match(/^\/(item|play)\/([^/]+)/i);
    return match?.[2] ? String(match[2]) : null;
  }, [pathname]);

  async function refreshBalance() {
    try {
      const res = await fetch("/api/me", { method: "GET", cache: "no-store" });
      if (!res.ok) return;
      const data: any = await res.json().catch(() => null);
      if (!data) return;
      const nextFree = Number(data?.freeCreditsBalance ?? data?.free ?? data?.freeBalance);
      const nextPaid = Number(data?.paidCreditsBalance ?? data?.paid ?? data?.paidBalance);
      if (Number.isFinite(nextFree)) setFree(nextFree);
      if (Number.isFinite(nextPaid)) setPaid(nextPaid);
    } catch {
      // ignore background refresh failures
    }
  }

  async function refreshDiscount(currentItemId: string | null) {
    if (!currentItemId) {
      setDiscount(null);
      setNewPrice(null);
      return;
    }

    try {
      const res = await fetch(`/api/item/${currentItemId}/buy`, { method: "GET", cache: "no-store" });
      const data: any = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setDiscount(null);
        setNewPrice(null);
        return;
      }
      const nextDiscount = Number(data?.playDiscountCredits ?? 0);
      const nextNewPrice = Number(data?.newPriceCredits ?? 0);
      setDiscount(Number.isFinite(nextDiscount) ? nextDiscount : null);
      setNewPrice(Number.isFinite(nextNewPrice) ? nextNewPrice : null);
    } catch {
      setDiscount(null);
      setNewPrice(null);
    }
  }

  useEffect(() => {
    if (usingProps) return;
    void refreshBalance();
    void refreshDiscount(itemIdFromPath);
  }, [usingProps, itemIdFromPath]);

  useEffect(() => {
    if (usingProps) return;
    const handler = () => {
      void refreshBalance();
      void refreshDiscount(itemIdFromPath);
    };
    window.addEventListener("pwnit:credits", handler as EventListener);
    window.addEventListener("pwnit:userChanged", handler as EventListener);
    window.addEventListener("focus", handler as EventListener);
    document.addEventListener("visibilitychange", handler as EventListener);
    return () => {
      window.removeEventListener("pwnit:credits", handler as EventListener);
      window.removeEventListener("pwnit:userChanged", handler as EventListener);
      window.removeEventListener("focus", handler as EventListener);
      document.removeEventListener("visibilitychange", handler as EventListener);
    };
  }, [usingProps, itemIdFromPath]);

  const freeCredits = Number.isFinite(free as number) ? (free as number) : null;
  const extraCredits = Number.isFinite(paid as number) ? (paid as number) : null;
  const total = (freeCredits ?? 0) + (extraCredits ?? 0);

  const discountText = useMemo(() => {
    if (discount == null) return null;
    if (newPrice == null) return `Discount ${formatZAR(discount)}`;
    return `Discount ${formatZAR(discount)} • New price ${formatZAR(newPrice)}`;
  }, [discount, newPrice]);

  return (
    <div className="inline-flex max-w-full flex-col rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Credits
      </span>
      <span className="text-sm font-bold text-slate-900 sm:text-base">
        {freeCredits == null && extraCredits == null ? "—" : total}
      </span>
      <span className="text-[11px] leading-4 text-slate-600 sm:text-xs">
        {freeCredits == null && extraCredits == null
          ? "Loading…"
          : `Free ${freeCredits ?? 0} • Extra ${extraCredits ?? 0}`}
      </span>
      {discountText ? <span className="mt-1 text-[11px] leading-4 text-emerald-700">{discountText}</span> : null}
    </div>
  );
}

export default CreditsPill;
