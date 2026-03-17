"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Summary = {
  isGuest: boolean;
  isDemoUser?: boolean;
  isLocalDev?: boolean;
  demoUserKey?: string | null;
  actorLabel: string;
  email: string | null;
  emailVerified: boolean;
};

const DEV_DEMO_COOKIE = "pwnit_demo_user";

export function AuthStatus({ initial }: { initial: Summary }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [summary, setSummary] = useState<Summary>(initial);
  const [busy, setBusy] = useState(false);

  const loginHref = useMemo(() => {
    const next = encodeURIComponent(pathname || "/");
    return `/login?next=${next}`;
  }, [pathname]);

  async function refresh() {
    try {
      const response = await fetch("/api/me", { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) return;

      setSummary({
        isGuest: Boolean(data.isGuest),
        isDemoUser: Boolean(data.isDemoUser),
        isLocalDev: Boolean(data.isLocalDev),
        demoUserKey: data.demoUserKey ? String(data.demoUserKey) : null,
        actorLabel: String(data.actorLabel || (data.isGuest ? "Playing as Guest" : data.email || "Account")),
        email: data.email ? String(data.email) : null,
        emailVerified: Boolean(data.emailVerified),
      });
    } catch {
      // ignore refresh failures
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      if (summary.isDemoUser) {
        setDemoUser(null);
        return;
      }

      await fetch("/api/auth/logout", { method: "POST" });
      window.dispatchEvent(new Event("pwnit:userChanged"));
      window.dispatchEvent(new Event("pwnit:credits"));
      router.refresh();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function setDemoUser(key: string | null) {
    if (key) {
      document.cookie = `${DEV_DEMO_COOKIE}=${encodeURIComponent(key)}; path=/; max-age=31536000; samesite=lax`;
    } else {
      document.cookie = `${DEV_DEMO_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
    }

    window.dispatchEvent(new Event("pwnit:userChanged"));
    window.dispatchEvent(new Event("pwnit:credits"));
    router.refresh();
    void refresh();
  }

  useEffect(() => {
    const handler = () => {
      void refresh();
    };

    window.addEventListener("pwnit:userChanged", handler as EventListener);
    window.addEventListener("focus", handler as EventListener);

    return () => {
      window.removeEventListener("pwnit:userChanged", handler as EventListener);
      window.removeEventListener("focus", handler as EventListener);
    };
  }, []);

  const demoSwitcher = summary.isLocalDev ? (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] shadow-sm">
      <span className="font-semibold text-amber-900">Local test user:</span>
      {[
        [null, "Guest"],
        ["demo1", "Demo 1"],
        ["demo2", "Demo 2"],
        ["demo3", "Demo 3"],
      ].map(([key, label]) => {
        const active = (key === null && !summary.isDemoUser) || summary.demoUserKey === key;

        return (
          <button
            key={String(key ?? "guest")}
            type="button"
            onClick={() => setDemoUser(key)}
            className={`rounded-full px-3 py-1 font-semibold transition ${
              active
                ? "bg-amber-900 text-white"
                : "border border-amber-300 bg-white text-slate-900 hover:bg-amber-100"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  ) : null;

  if (summary.isGuest) {
    return (
      <div className="flex flex-col gap-2">
        {demoSwitcher}
        <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
          <span className="font-semibold text-slate-900">Playing as Guest</span>
          <Link
            href={loginHref}
            className="rounded-full bg-slate-900 px-3 py-1.5 font-semibold text-white transition hover:bg-slate-800"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {demoSwitcher}
      <div className="flex flex-wrap items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs shadow-sm">
        <span className="font-semibold text-slate-900">{summary.email || summary.actorLabel}</span>
        <span className="text-emerald-700">{summary.isDemoUser ? "Demo user" : "Signed in"}</span>
        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="rounded-full border border-emerald-300 bg-white px-3 py-1.5 font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (summary.isDemoUser ? "Leaving demo…" : "Signing out…") : (summary.isDemoUser ? "Use Guest" : "Sign out")}
        </button>
      </div>
    </div>
  );
}

export default AuthStatus;
