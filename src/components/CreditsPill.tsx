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
    const m = pathname?.match(/^\/(item|play)\/([^\/]+)/i);
    return m?.[2] ? String(m[2]) : null;
  }, [pathname]);

  async function refreshBalance() {
    try {
      const res = await fetch("/api/me", { method: "GET", cache: "no-store" });
      if (!res.ok) return;
      const data: any = await res.json().catch(() => null);
      if (!data) return;
      const f = Number(data?.freeCreditsBalance ?? data?.free ?? data?.freeBalance);
      const p = Number(data?.paidCreditsBalance ?? data?.paid ?? data?.paidBalance);
      if (Number.isFinite(f)) setFree(f);
      if (Number.isFinite(p)) setPaid(p);
    } catch {}
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
      const v = Number(data?.playDiscountCredits ?? 0);
      const d = Number(data?.newPriceCredits ?? 0);
      setDiscount(Number.isFinite(v) ? v : null);
      setNewPrice(Number.isFinite(d) ? d : null);
    } catch {
      setDiscount(null);
      setNewPrice(null);
    }
  }

  useEffect(() => {
    if (usingProps) return;
    refreshBalance();
    refreshDiscount(itemIdFromPath);
  }, [usingProps, itemIdFromPath]);

  useEffect(() => {
    if (usingProps) return;
    const handler = () => {
      refreshBalance();
      refreshDiscount(itemIdFromPath);
    };
    window.addEventListener("pwnit:credits", handler as any);
    window.addEventListener("pwnit:userChanged", handler as any);
    window.addEventListener("focus", handler as any);
    document.addEventListener("visibilitychange", handler as any);
    return () => {
      window.removeEventListener("pwnit:credits", handler as any);
      window.removeEventListener("pwnit:userChanged", handler as any);
      window.removeEventListener("focus", handler as any);
      document.removeEventListener("visibilitychange", handler as any);
    };
  }, [usingProps, itemIdFromPath]);

  const f = Number.isFinite(free as any) ? (free as number) : null;
  const p = Number.isFinite(paid as any) ? (paid as number) : null;
  const total = (f ?? 0) + (p ?? 0);

  const details = useMemo(() => {
    if (f == null && p == null) return "—";
    const parts: string[] = [];
    if (f != null) parts.push(`free ${f}`);
    if (p != null) parts.push(`paid ${p}`);
    return parts.join(" • ");
  }, [f, p]);

  const discountText = useMemo(() => {
    if (discount == null) return null;
    if (newPrice == null) return `Discount ${formatZAR(discount)}`;
    return `Discount ${formatZAR(discount)} • New price ${formatZAR(newPrice)}`;
  }, [discount, newPrice]);

  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-900 shadow-sm sm:gap-2 sm:text-xs">
      <span className="hidden sm:inline">Credits:</span>
      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-white">{f == null && p == null ? "—" : total}</span>
      <span className="hidden md:inline text-slate-600">{details}</span>
      {discountText ? (
        <span className="hidden lg:inline rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">{discountText}</span>
      ) : null}
    </span>
  );
}

export default CreditsPill;
