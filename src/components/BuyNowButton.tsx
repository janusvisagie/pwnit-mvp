// src/components/BuyNowButton.tsx
"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export function BuyNowButton({
  itemId,
  className,
  children,
}: {
  itemId?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams() as any;
  const resolvedItemId = itemId || params?.id || params?.itemId;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onBuy() {
    if (!resolvedItemId) {
      setMsg("Missing itemId");
      return;
    }
    setBusy(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/item/${resolvedItemId}/buy`, { method: "POST" });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setMsg(data?.error || "Could not buy");
        return;
      }

      setMsg(`Purchased! Paid ${data.payCredits} credits. New balance: ${data.newBalance}.`);
      router.refresh();
      window.dispatchEvent(new Event("pwnit:credits"));
    } catch (e: any) {
      setMsg(e?.message || "Could not buy");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <button
        onClick={onBuy}
        disabled={busy}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {children ?? (busy ? "Buying…" : "Buy Now")}
      </button>

      {msg ? (
        <div className="mt-2 text-xs font-semibold text-slate-700">{msg}</div>
      ) : null}
    </div>
  );
}

export default BuyNowButton;
