// src/components/BuyNowButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BuyNowButton({
  itemId,
  className,
  children,
}: {
  itemId: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onBuy() {
    if (!itemId) {
      setMsg("Missing itemId");
      return;
    }
    setBusy(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/item/${itemId}/buy`, { method: "POST" });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setMsg(data?.error || "Could not buy");
        return;
      }

      setMsg(`Purchased! Paid ${data.payCredits} credits. New balance: ${data.newBalance}.`);
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message || "Could not buy");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onBuy}
        disabled={busy}
        className={
          className ??
          [
            "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-extrabold",
            busy ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800",
          ].join(" ")
        }
      >
        {children ?? (busy ? "Buying…" : "Buy Now")}
      </button>

      {msg ? (
        <div className="text-xs font-semibold text-slate-700">{msg}</div>
      ) : null}
    </div>
  );
}
