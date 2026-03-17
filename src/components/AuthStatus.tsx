"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Summary = {
  isGuest: boolean;
  actorLabel: string;
  email: string | null;
  emailVerified: boolean;
};

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

  if (summary.isGuest) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
        <span className="font-semibold text-slate-900">Playing as Guest</span>
        <Link
          href={loginHref}
          className="rounded-full bg-slate-900 px-3 py-1.5 font-semibold text-white transition hover:bg-slate-800"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs shadow-sm">
      <span className="font-semibold text-slate-900">{summary.email || summary.actorLabel}</span>
      <span className="text-emerald-700">Signed in</span>
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        className="rounded-full border border-emerald-300 bg-white px-3 py-1.5 font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}

export default AuthStatus;
