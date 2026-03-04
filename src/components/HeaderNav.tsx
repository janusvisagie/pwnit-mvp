// src/components/HeaderNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Top-right nav links used by the global header.
 * Exports BOTH named and default to avoid import mismatches:
 *   - import HeaderNav from "@/components/HeaderNav"
 *   - import { HeaderNav } from "@/components/HeaderNav"
 */
export function HeaderNav() {
  const pathname = usePathname() || "/";
  const onHome = pathname === "/";

  return (
    <nav className="flex items-center gap-3 text-sm">
      {!onHome && (
        <Link className="font-semibold text-slate-900 hover:underline" href="/">
          Home
        </Link>
      )}

      <Link className="font-semibold text-slate-900 hover:underline" href="/buy-credits">
        Buy credits
      </Link>

      <Link className="font-semibold text-slate-900 hover:underline" href="/how-activation-works">
        How it works
      </Link>

      <Link className="font-semibold text-slate-900 hover:underline" href="/dashboard">
        Dashboard
      </Link>

      <Link className="font-semibold text-slate-900 hover:underline" href="/admin">
        Admin
      </Link>
    </nav>
  );
}

export default HeaderNav;
