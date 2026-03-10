// src/components/HeaderNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderNav() {
  const pathname = usePathname() || "/";

  const is = (p: string) => pathname === p;

  const Item = ({ href, label }: { href: string; label: string }) => {
    if (is(href)) return null;

    return (
      <Link className="shrink-0 font-semibold text-slate-900 hover:underline" href={href}>
        {label}
      </Link>
    );
  };

  return (
    <nav className="flex w-max items-center gap-5 whitespace-nowrap px-1 text-[15px] sm:text-sm md:w-auto md:gap-3 md:px-0">
      <Item href="/" label="Home" />
      <Item href="/buy-credits" label="Buy credits" />
      <Item href="/how-activation-works" label="How it works" />
      <Item href="/dashboard" label="Dashboard" />
      <Item href="/admin" label="Admin" />
    </nav>
  );
}

export default HeaderNav;
