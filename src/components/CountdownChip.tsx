// src/components/CountdownChip.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  state?: string | null;
  closesAt?: string | null;
  closesAtIso?: string | null;
  /** What to show when countdown hits zero */
  labelWhenClosed?: string;
};

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function CountdownChip({
  state,
  closesAt,
  closesAtIso,
  labelWhenClosed = "Closed",
}: Props) {
  const router = useRouter();
  const refreshedRef = useRef(false);

  const iso = closesAtIso ?? closesAt ?? null;

  const targetMs = useMemo(() => {
    if (!iso) return null;
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : null;
  }, [iso]);

  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!targetMs) return;
    const id = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, [targetMs]);

  // If caller provides state, only show when live.
  const hasState = typeof state === "string" && state.length > 0;
  const isLive = !hasState || (state || "").toUpperCase() === "ACTIVATED";

  if (!isLive || !targetMs) return null;

  const remaining = targetMs - nowMs;

  if (remaining <= 0) {
    // Refresh once to allow the server-rendered pages to transition state.
    if (!refreshedRef.current) {
      refreshedRef.current = true;
      // small delay ensures UI paints first
      setTimeout(() => router.refresh(), 150);
    }
    return (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
        {labelWhenClosed}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
      {formatMs(remaining)}
    </span>
  );
}

export default CountdownChip;
