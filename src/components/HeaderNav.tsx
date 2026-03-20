"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type MeSummary = {
  isLocalDev?: boolean;
};

type NavItem = {
  href: string;
  label: string;
  mobileMode?: "always" | "home-only" | "hide-on-detail" | "never";
  desktop?: boolean;
  show?: boolean;
};

export function HeaderNav() {
  const pathname = usePathname() || "/";
  const [me, setMe] = useState<MeSummary>({ isLocalDev: false });

  useEffect(() => {
    let alive = true;

    async function refresh() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (!alive || !response.ok || !data?.ok) return;
        setMe({ isLocalDev: Boolean(data.isLocalDev) });
      } catch {
        // Ignore header refresh failures.
      }
    }

    void refresh();

    const handler = () => {
      void refresh();
    };

    window.addEventListener("pwnit:userChanged", handler as EventListener);
    window.addEventListener("focus", handler as EventListener);

    return () => {
      alive = false;
      window.removeEventListener("pwnit:userChanged", handler as EventListener);
      window.removeEventListener("focus", handler as EventListener);
    };
  }, []);

  const isLocalHost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const showAdmin = Boolean(me.isLocalDev || isLocalHost);
  const isDetailPage = pathname.startsWith("/item/") || pathname.startsWith("/play/");

  const items = useMemo<NavItem[]>(
    () => [
      { href: "/", label: "Home", mobileMode: "always", desktop: true, show: true },
      { href: "/pay", label: "Buy credits", mobileMode: "always", desktop: true, show: true },
      { href: "/how-activation-works", label: "How it works", mobileMode: "always", desktop: true, show: true },
      { href: "/dashboard", label: "Dashboard", mobileMode: "hide-on-detail", desktop: true, show: true },
      { href: "/referrals", label: "Referrals", mobileMode: "hide-on-detail", desktop: true, show: true },
      { href: "/feedback", label: "Feedback", mobileMode: "hide-on-detail", desktop: true, show: true },
      { href: "/terms", label: "Terms", mobileMode: "hide-on-detail", desktop: true, show: true },
      { href: "/admin", label: "Admin", mobileMode: "never", desktop: true, show: showAdmin },
    ].filter((item) => item.show !== false),
    [showAdmin],
  );

  const mobileItems = items.filter((item) => {
    if (item.mobileMode === "never") return false;
    if (item.mobileMode === "always") return true;
    if (item.mobileMode === "hide-on-detail") return !isDetailPage;
    return pathname === "/";
  });

  function linkClasses(active: boolean, tone: "mobile" | "desktop") {
    if (tone === "mobile") {
      return [
        "rounded-full border px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900",
      ].join(" ");
    }

    return [
      "rounded-full px-3 py-1.5 text-sm font-medium transition",
      active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    ].join(" ");
  }

  return (
    <>
      <nav className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 md:hidden">
        {mobileItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={linkClasses(active, "mobile")}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <nav className="hidden items-center gap-1 md:flex md:flex-wrap md:justify-end">
        {items.filter((item) => item.desktop).map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={linkClasses(active, "desktop")}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default HeaderNav;
