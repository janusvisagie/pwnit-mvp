"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderNav() {
  const pathname = usePathname() || "/";

  const is = (p: string) => pathname === p;

  const Item = ({ href, label }: { href: string; label: string }) => {
    if (is(href)) return null;

    return (
      <Link
        className="inline-flex min-h-[42px] shrink-0 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 hover:shadow-md"
        href={href}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="flex w-max items-center gap-2 whitespace-nowrap px-1 text-[15px] md:w-auto md:px-0">
      <Item href="/" label="Home" />
      <Item href="/buy-credits" label="Buy credits" />
      <Item href="/how-activation-works" label="How it works" />
      <Item href="/dashboard" label="Dashboard" />
      <Item href="/admin" label="Admin" />
    </nav>
  );
}

export default HeaderNav;
