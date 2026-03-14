"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderNav() {
  const pathname = usePathname() || "/";

  const Item = ({ href, label }: { href: string; label: string }) => {
    const active = pathname === href;

    return (
      <Link
        className={[
          "whitespace-nowrap text-sm font-semibold transition",
          active ? "text-blue-600" : "text-slate-900 hover:text-blue-600",
        ].join(" ")}
        href={href}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="flex items-center gap-6 overflow-x-auto whitespace-nowrap text-sm font-semibold scrollbar-hide">
      <Item href="/" label="Home" />
      <Item href="/buy-credits" label="Buy credits" />
      <Item href="/how-activation-works" label="How it works" />
      <Item href="/dashboard" label="Dashboard" />
      <Item href="/admin" label="Admin" />
    </nav>
  );
}

export default HeaderNav;
