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
  mobileMode: "always" | "home-only" | "never";
  desktop: boolean;
  show: boolean;
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

  const isLocalHost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);

  const showAdmin = Boolean(me.isLocalDev || isLocalHost);
  const isHomePage = pathname === "/";
  const isDetailPage = pathname.startsWith("/item/") || pathname.startsWith("/play/");

  const items = useMemo(
    () =>
      ([
        { href: "/", label: "Home", mobileMode: "always", desktop: true, show: true },
        { href: "/pay", label: "Buy credits", mobileMode: "always", desktop: true, show: true },
        {
          href: "/how-activation-works",
          label: "How it works",
          mobileMode: "always",
          desktop: true,
          show: true,
        },
        {
          href: "/dashboard",
          label: "Dashboard",
          mobileMode: "home-only",
          desktop: true,
          show: true,
        },
        {
          href: "/referrals",
          label: "Referrals",
          mobileMode: "home-only",
          desktop: true,
          show: true,
        },
        {
          href: "/feedback",
          label: "Feedback",
          mobileMode: "home-only",
          desktop: true,
          show: true,
        },
        {
          href: "/terms",
          label: "Terms",
          mobileMode: "home-only",
          desktop: true,
          show: true,
        },
        {
          href: "/admin",
          label: "Admin",
          mobileMode: "never",
          desktop: true,
          show: showAdmin,
        },
      ] satisfies NavItem[]),
    [showAdmin]
  );

  const visibleItems = items.filter((item) => item.show);

  const mobileItems = visibleItems.filter((item) => {
    if (item.mobileMode === "never") return false;
    if (item.mobileMode === "always") return true;
    if (item.mobileMode === "home-only") return isHomePage && !isDetailPage;
    return false;
  });

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  }

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
      active
        ? "bg-slate-900 text-white"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    ].join(" ");
  }

  return (
    <>
      <nav className="flex flex-wrap items-center gap-2 md:hidden">
        {mobileItems.map((item) => (
          <Link
            key={`mobile-${item.href}`}
            href={item.href}
            className={linkClasses(isActive(item.href), "mobile")}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <nav className="hidden items-center gap-1 md:flex lg:gap-2">
        {visibleItems
          .filter((item) => item.desktop)
          .map((item) => (
            <Link
              key={`desktop-${item.href}`}
              href={item.href}
              className={linkClasses(isActive(item.href), "desktop")}
            >
              {item.label}
            </Link>
          ))}
      </nav>
    </>
  );
}

export default HeaderNav;
