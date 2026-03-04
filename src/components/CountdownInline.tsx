"use client";

import { useEffect, useMemo, useState } from "react";

export function CountdownInline({ iso }: { iso: string | null }) {
  const target = useMemo(() => (iso ? new Date(iso).getTime() : 0), [iso]);

  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // stable initial render
  if (!mounted) {
    return <span style={{ fontVariantNumeric: "tabular-nums" }}>0:00</span>;
  }

  if (!iso) {
    return <span style={{ fontVariantNumeric: "tabular-nums" }}>0:00</span>;
  }

  const ms = Math.max(0, target - now);
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;

  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {m}:{String(s).padStart(2, "0")}
    </span>
  );
}




