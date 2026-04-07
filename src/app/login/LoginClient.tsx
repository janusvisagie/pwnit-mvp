
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import TurnstileWidget from "@/components/TurnstileWidget";

type Mode = "login" | "register";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export default function LoginClient({
  nextPath,
  initialMode,
}: {
  nextPath: string;
  initialMode: Mode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const heading = useMemo(
    () => (mode === "register" ? "Create your account" : "Sign in to your account"),
    [mode],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setBusy(false);
      setError("Please complete the human check first.");
      return;
    }

    try {
      const response = await fetch(mode === "register" ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          next: nextPath,
          turnstileToken,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setError(String(data?.error || "Something went wrong."));
        setTurnstileToken(null);
        return;
      }

      window.dispatchEvent(new Event("pwnit:userChanged"));
      window.dispatchEvent(new Event("pwnit:credits"));
      router.replace(String(data.nextPath || nextPath || "/"));
      router.refresh();
    } catch {
      setError("Could not complete the request. Please try again.");
      setTurnstileToken(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">PwnIt account</div>
      <h1 className="mt-2 text-2xl font-black text-slate-950">{heading}</h1>

      <p className="mt-3 text-sm text-slate-600">
        Guest mode stays available. Creating an account lets you keep progress, receive prizes, and use account-only features.
      </p>

      <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
            setTurnstileToken(null);
          }}
          className={[
            "rounded-2xl px-4 py-2 text-sm font-semibold transition",
            mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
          ].join(" ")}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError(null);
            setTurnstileToken(null);
          }}
          className={[
            "rounded-2xl px-4 py-2 text-sm font-semibold transition",
            mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
          ].join(" ")}
        >
          Create account
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-slate-800">
          Email address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-800">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
            placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
        </label>

        {mode === "register" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            If you are currently playing as a guest on this browser, creating an account will keep that guest progress under your new account.
          </div>
        ) : null}

        {TURNSTILE_SITE_KEY ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Human check</div>
            <TurnstileWidget
              siteKey={TURNSTILE_SITE_KEY}
              action={mode === "register" ? "register" : "login"}
              className="min-h-[65px]"
              onVerify={(token) => {
                setTurnstileToken(token);
                setError(null);
              }}
              onExpire={() => setTurnstileToken(null)}
              onError={(message) => {
                setTurnstileToken(null);
                setError(message);
              }}
            />
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {busy ? (mode === "register" ? "Creating account…" : "Signing in…") : mode === "register" ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-600">
        <Link href="/" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
          Continue as guest
        </Link>
        <Link href={nextPath || "/"} className="underline-offset-2 hover:underline">
          Back
        </Link>
      </div>
    </div>
  );
}
