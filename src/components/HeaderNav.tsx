"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type MeSummary = {
  isGuest?: boolean;
  isDemoUser?: boolean;
  isLocalDev?: boolean;
};

type NavItem = {
  href: string;
  label: string;
  show: boolean;
};

export function HeaderNav() {
  const pathname = usePathname() || "/";
  const [me, setMe] = useState<MeSummary>({ isGuest: true, isDemoUser: false, isLocalDev: false });

  useEffect(() => {
    let alive = true;

    async function refresh() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (!alive || !response.ok || !data?.ok) return;

        setMe({
          isGuest: Boolean(data.isGuest),
          isDemoUser: Boolean(data.isDemoUser),
          isLocalDev: Boolean(data.isLocalDev),
        });
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
  const showDashboard = !Boolean(me.isGuest) && (!Boolean(me.isDemoUser) || isLocalHost || Boolean(me.isLocalDev));

  const items = useMemo<NavItem[]>(
    () => [
      { href: "/", label: "Home", show: true },
      { href: "/how-activation-works", label: "How it works", show: true },
      { href: "/referrals", label: "Referrals", show: true },
      { href: "/feedback", label: "Feedback", show: true },
      { href: "/terms", label: "Terms", show: true },
      { href: "/dashboard", label: "Dashboard", show: showDashboard },
      { href: "/admin", label: "Admin", show: showAdmin },
    ].filter((item) => item.show),
    [showAdmin, showDashboard],
  );

  return (
    <nav className="flex flex-wrap items-center justify-end gap-2 text-sm">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-full border px-3 py-1.5 font-semibold transition",
              active
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default HeaderNav;
