// src/components/CreditsPill.tsx
"use client";

import { useEffect, useState } from "react";

/**
 * Small, resilient credits badge for the header.
 * - If you pass balances as props, it uses them.
 * - Otherwise it will try fetch("/api/me") and look for { freeCreditsBalance, paidCreditsBalance }.
 *   If that route doesn't exist yet, it fails gracefully (shows a dash).
 */
export function CreditsPill(props?: { free?: number; paid?: number }) {
  const [free, setFree] = useState<number | null>(typeof props?.free === "number" ? props!.free : null);
  const [paid, setPaid] = useState<number | null>(typeof props?.paid === "number" ? props!.paid : null);

  useEffect(() => {
    // If props provided, don't fetch.
    if (typeof props?.free === "number" || typeof props?.paid === "number") return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/me", { method: "GET" });
        if (!res.ok) return;
        const data: any = await res.json();
        if (cancelled) return;

        const f = Number(data?.freeCreditsBalance ?? data?.free ?? data?.freeBalance);
        const p = Number(data?.paidCreditsBalance ?? data?.paid ?? data?.paidBalance);

        if (Number.isFinite(f)) setFree(f);
        if (Number.isFinite(p)) setPaid(p);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [props?.free, props?.paid]);

  const f = Number.isFinite(free as any) ? (free as number) : null;
  const p = Number.isFinite(paid as any) ? (paid as number) : null;

  const total = (f ?? 0) + (p ?? 0);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-extrabold text-white shadow-sm">
      <span>Credits:</span>
      {f == null && p == null ? (
        <span className="tabular-nums">—</span>
      ) : (
        <span className="tabular-nums">
          {total}
          {f != null ? <span className="ml-1 text-white/80">(free {f}{p ? ` • paid ${p}` : ""})</span> : null}
        </span>
      )}
    </div>
  );
}

export default CreditsPill;
