"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefreshActivated({
  enabled,
  everyMs = 10_000,
}: {
  enabled: boolean;
  everyMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => {
      router.refresh(); // re-runs the server component -> state machine updates
    }, everyMs);
    return () => clearInterval(t);
  }, [enabled, everyMs, router]);

  return null;
}
