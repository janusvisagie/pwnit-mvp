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
  const refreshed = useRef(false);

  useEffect(() => {
    if (!targetMs) return;
    const id = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, [targetMs]);

  const isLive = (state || "").toUpperCase() === "ACTIVATED";
  if (!isLive || !targetMs) return null;

  const remaining = targetMs - nowMs;
  if (remaining <= 0) {
    if (!refreshed.current) {
      refreshed.current = true;
      setTimeout(() => window.location.reload(), 350);
    }

    return (
      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-900 ring-1 ring-slate-200">
        Closed
      </span>
    );
  }

  return (
    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-slate-900 ring-1 ring-slate-200">
      {formatMs(remaining)}
    </span>
  );
}
