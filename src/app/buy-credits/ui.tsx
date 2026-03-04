// src/app/buy-credits/ui.tsx
"use client";

import { useState } from "react";

export function BuyCreditsButton() {
  const [loading, setLoading] = useState(false);

  async function buy() {
    setLoading(true);
    try {
      await fetch("/api/credits/buy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bundleKey: "medium" }) });
      // simplest refresh
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={buy}
      disabled={loading}
      className={[
        "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold",
        loading ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800",
      ].join(" ")}
    >
      {loading ? "Adding..." : "Buy 30 credits"}
    </button>
  );
}
