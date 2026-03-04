// src/components/TopNavLinks.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopNavLinks() {
  const pathname = usePathname() || "/";

  const isHow = pathname.startsWith("/how-activation-works");
  const isBuy = pathname.startsWith("/buy-credits");

  return (
    <div className="flex flex-wrap items-center gap-3">
      {!isBuy ? (
        <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/buy-credits">
          Buy credits
        </Link>
      ) : null}
      {!isHow ? (
        <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/how-activation-works">
          How it works
        </Link>
      ) : null}
    </div>
  );
}
