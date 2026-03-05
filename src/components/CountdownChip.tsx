// src/components/CountdownChip.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  state?: string | null;
  closesAt?: string | null;
};

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function CountdownChip({ state, closesAt }: Props) {
  const targetMs = useMemo(() => {
    if (!closesAt) return null;
    const t = Date.parse(closesAt);
    return Number.isFinite(t) ? t : null;
  }, [closesAt]);

  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const didRefresh = useRef(false);

  // Tick only when we have a valid target.
  useEffect(() => {
    if (!targetMs) return;
    const id = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, [targetMs]);

  // Hide countdown unless live.
  const isLive = (state || "").toUpperCase() === "ACTIVATED";
  if (!isLive || !targetMs) return null;

  const remaining = targetMs - nowMs;
  if (remaining <= 0) {
    // Avoid “Ending…” getting stuck: once we hit zero, refresh once so server-rendered
    // pages can transition to CLOSED/PUBLISHED.
    if (!didRefresh.current) {
      didRefresh.current = true;
      setTimeout(() => {
        try {
          window.location.reload();
        } catch {
          /* no-op */
        }
      }, 600);
    }
    return (
      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-900 ring-1 ring-slate-200">
        Closed
      </span>
    );
  }

  return (
    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-slate-900 ring-1 ring-slate-200">
      <span className="mr-1 text-slate-600">Ends in</span>
      {formatMs(remaining)}
    </span>
  );
}
