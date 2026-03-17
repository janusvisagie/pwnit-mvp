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

type DemoOption = "guest" | "demo1" | "demo2" | "demo3";

export function AuthStatus({ initial }: { initial: Summary }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [summary, setSummary] = useState<Summary>(initial);
  const [busy, setBusy] = useState(false);

  const loginHref = useMemo(() => {
    const next = encodeURIComponent(pathname || "/");
    return `/login?next=${next}`;
  }, [pathname]);

  const activeDemoOption: DemoOption = summary.isDemoUser
    ? ((summary.demoUserKey as DemoOption) || "demo1")
    : "guest";

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

  async function handleDemoChange(value: DemoOption) {
    setBusy(true);
    try {
      setDemoUser(value === "guest" ? null : value);
    } finally {
      setBusy(false);
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
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs shadow-sm">
      <label htmlFor="local-demo-user" className="font-semibold text-amber-900">
        Local test user:
      </label>
      <select
        id="local-demo-user"
        value={activeDemoOption}
        disabled={busy}
        onChange={(event) => {
          void handleDemoChange(event.target.value as DemoOption);
        }}
        className="rounded-full border border-amber-300 bg-white px-3 py-1.5 font-semibold text-slate-900 shadow-sm outline-none transition focus:border-amber-500"
      >
        <option value="guest">Guest</option>
        <option value="demo1">Demo 1</option>
        <option value="demo2">Demo 2</option>
        <option value="demo3">Demo 3</option>
      </select>
      <span className="text-amber-800">
        {summary.isDemoUser ? `Now using ${summary.actorLabel}` : "Now using Guest"}
      </span>
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
        {!summary.isDemoUser ? (
          <button
            type="button"
            onClick={signOut}
            disabled={busy}
            className="rounded-full border border-emerald-300 bg-white px-3 py-1.5 font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default AuthStatus;
