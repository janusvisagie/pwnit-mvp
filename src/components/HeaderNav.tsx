"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  mobileMode?: "always" | "hide-on-detail" | "never";
  desktop?: boolean;
  show?: boolean;
};

export function HeaderNav() {
  const pathname = usePathname() || "/";
  const [isLocalHost, setIsLocalHost] = useState(false);

  useEffect(() => {
    setIsLocalHost(["localhost", "127.0.0.1"].includes(window.location.hostname));
  }, []);

  const isDetailPage = pathname.startsWith("/item/") || pathname.startsWith("/play/");

  const items = useMemo(
    () =>
      ([
        { href: "/", label: "Campaigns", mobileMode: "always", desktop: true, show: true },
        { href: "/buy-credits", label: "Credits", mobileMode: "always", desktop: true, show: true },
        { href: "/pwnit-2", label: "How it works", mobileMode: "always", desktop: true, show: true },
        { href: "/dashboard", label: "Profile", mobileMode: "hide-on-detail", desktop: true, show: true },
        { href: "/referrals", label: "Referrals", mobileMode: "hide-on-detail", desktop: true, show: true },
        { href: "/feedback", label: "Feedback", mobileMode: "hide-on-detail", desktop: true, show: true },
        { href: "/terms", label: "Terms", mobileMode: "hide-on-detail", desktop: true, show: true },
        { href: "/admin", label: "Admin", mobileMode: "never", desktop: true, show: isLocalHost },
      ] satisfies NavItem[]).filter((item) => item.show !== false),
    [isLocalHost],
  );

  const mobileItems = items.filter((item) => {
    if (item.mobileMode === "never") return false;
    if (item.mobileMode === "always") return true;
    if (item.mobileMode === "hide-on-detail") return !isDetailPage;
    return true;
  });

  function linkClasses(active: boolean, tone: "mobile" | "desktop") {
    if (tone === "mobile") {
      return [
        "rounded-full border px-3 py-1.5 text-sm font-bold whitespace-nowrap transition",
        active
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800",
      ].join(" ");
    }

    return [
      "rounded-full px-3 py-1.5 text-sm font-bold transition",
      active
        ? "bg-slate-950 text-white"
        : "text-slate-600 hover:bg-gradient-to-r hover:from-amber-50 hover:to-cyan-50 hover:text-slate-950",
    ].join(" ");
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <nav className="flex gap-2 overflow-x-auto pb-2 sm:hidden" aria-label="Primary mobile navigation">
        {mobileItems.map((item) => (
          <Link key={item.href} className={linkClasses(isActive(item.href), "mobile")} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary navigation">
        {items
          .filter((item) => item.desktop)
          .map((item) => (
            <Link key={item.href} className={linkClasses(isActive(item.href), "desktop")} href={item.href}>
              {item.label}
            </Link>
          ))}
      </nav>
    </>
  );
}

export default HeaderNav;
