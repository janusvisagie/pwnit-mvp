"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type Mode = "login" | "register";

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

  const heading = useMemo(
    () => (mode === "register" ? "Create your account" : "Sign in to your account"),
    [mode],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

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
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        setError(String(data?.error || "Something went wrong."));
        return;
      }

      window.dispatchEvent(new Event("pwnit:userChanged"));
      window.dispatchEvent(new Event("pwnit:credits"));
      router.replace(String(data.nextPath || nextPath || "/"));
      router.refresh();
    } catch {
      setError("Could not complete the request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md py-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">PwnIt account</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{heading}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Guest mode stays available. Creating an account lets you keep progress, receive prizes, and use account-only features.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={[
              "rounded-2xl px-4 py-2 text-sm font-semibold transition",
              mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
            ].join(" ")}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={[
              "rounded-2xl px-4 py-2 text-sm font-semibold transition",
              mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
            ].join(" ")}
          >
            Create account
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-800">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete={mode === "register" ? "email" : "username"}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-800">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
            />
          </div>

          {mode === "register" ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              If you are currently playing as a guest on this browser, creating an account will keep that guest progress under your new account.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy
              ? mode === "register"
                ? "Creating account…"
                : "Signing in…"
              : mode === "register"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-600">
          <Link href={nextPath || "/"} className="font-semibold text-slate-900 underline underline-offset-2">
            Continue as guest
          </Link>
        </div>
      </div>
    </div>
  );
}
