"use client";

import { useEffect } from "react";

export function ReferralCapture({ code, itemId }: { code: string; itemId: string }) {
  useEffect(() => {
    if (!code || !itemId) return;
    fetch("/api/referrals/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, itemId }),
    }).catch(() => null);
  }, [code, itemId]);

  return null;
}

export default ReferralCapture;
