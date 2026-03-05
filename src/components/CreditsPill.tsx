// src/components/CreditsPill.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Small, resilient credits badge for the header.
 * - If you pass balances as props, it uses them.
 * - Otherwise it fetches /api/me and listens for "pwnit:credits" events to refresh.
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

  async function refresh() {
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

  // Initial load + refresh on route change (only when not controlled by props)
  useEffect(() => {
    if (usingProps) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingProps, pathname]);

  // Refresh when game play or buy triggers a credits change
  useEffect(() => {
    if (usingProps) return;
    const handler = () => refresh();
    window.addEventListener("pwnit:credits", handler as any);
    return () => window.removeEventListener("pwnit:credits", handler as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingProps]);

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

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
      <span>Credits:</span>
      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-white">
        {f == null && p == null ? "—" : total}
      </span>
      <span className="text-slate-600">{details}</span>
    </span>
  );
}

export default CreditsPill;
