// src/components/CreditsPill.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Small, resilient credits badge for the header.
 * - If you pass balances as props, it uses them.
 * - Otherwise it fetches /api/me and listens for events to refresh.
 * - On item-related routes it also shows the "Voucher" (50% of paid credits spent on that item today).
 */
export function CreditsPill(props?: { free?: number; paid?: number }) {
  const pathname = usePathname();

  const usingProps = typeof props?.free === "number" || typeof props?.paid === "number";

  const [free, setFree] = useState<number | null>(
    typeof props?.free === "number" ? props!.free : null
  );
  const [paid, setPaid] = useState<number | null>(
    typeof props?.paid === "number" ? props!.paid : null
  );

  const [voucher, setVoucher] = useState<number | null>(null);
  const [amountDue, setAmountDue] = useState<number | null>(null);

  const itemIdFromPath = useMemo(() => {
    // /item/:id, /item/:id/leaderboard, /play/:id
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
    } catch {
      // ignore
    }
  }

  async function refreshVoucher(currentItemId: string | null) {
    if (!currentItemId) {
      setVoucher(null);
      setAmountDue(null);
      return;
    }

    try {
      const res = await fetch(`/api/item/${currentItemId}/buy`, {
        method: "GET",
        cache: "no-store",
      });
      const data: any = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        // No voucher display if quote isn't available (winner / already bought / etc.)
        setVoucher(null);
        setAmountDue(null);
        return;
      }
      const v = Number(data?.voucherCredits ?? data?.discountAppliedCredits);
      const d = Number(data?.amountDueCredits ?? data?.payCredits);
      setVoucher(Number.isFinite(v) ? v : null);
      setAmountDue(Number.isFinite(d) ? d : null);
    } catch {
      setVoucher(null);
      setAmountDue(null);
    }
  }

  // Initial load + refresh on route change (only when not controlled by props)
  useEffect(() => {
    if (usingProps) return;
    refreshBalance();
    refreshVoucher(itemIdFromPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingProps, pathname]);

  // Refresh when game play / buy / demo-user switch triggers a credits change
  useEffect(() => {
    if (usingProps) return;

    const handler = () => {
      refreshBalance();
      refreshVoucher(itemIdFromPath);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const voucherText = useMemo(() => {
    if (voucher == null) return null;
    if (amountDue == null) return `Voucher ${voucher}`;
    return `Voucher ${voucher} • Due ${amountDue}`;
  }, [voucher, amountDue]);

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
      <span>Credits:</span>
      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-white">
        {f == null && p == null ? "—" : total}
      </span>
      <span className="text-slate-600">{details}</span>

      {voucherText ? (
        <span className="ml-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
          {voucherText}
        </span>
      ) : null}
    </span>
  );
}

export default CreditsPill;
