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

  const is = (p: string) => pathname === p;

  const Item = ({ href, label }: { href: string; label: string }) => {
    // Don't show a link to the current page (no "self link")
    if (is(href)) return null;

    return (
      <Link className="font-semibold text-slate-900 hover:underline" href={href}>
        {label}
      </Link>
    );
  };

  return (
    <nav className="flex items-center gap-3 text-sm">
      <Item href="/" label="Home" />
      <Item href="/buy-credits" label="Buy credits" />
      <Item href="/how-activation-works" label="How it works" />
      <Item href="/dashboard" label="Dashboard" />
      <Item href="/admin" label="Admin" />
    </nav>
  );
}

export default HeaderNav;
