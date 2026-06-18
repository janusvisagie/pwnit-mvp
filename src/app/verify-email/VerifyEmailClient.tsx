"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VerifyEmailClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function verify() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/auth/confirm-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(String(data?.error || "Verification failed."));
        return;
      }
      setDone(true);
      window.dispatchEvent(new Event("pwnit:userChanged"));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/auth/send-verification", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(String(data?.error || "Couldn't send a code."));
        return;
      }
      setNotice(
        data?.alreadyVerified
          ? "Your email is already verified."
          : "We've sent a fresh code to your email.",
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-[28px] border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">PwnIt account</div>
        <h1 className="mt-2 text-2xl font-black text-slate-950">Email verified</h1>
        <p className="mt-3 text-sm text-slate-600">Thanks — your email is confirmed.</p>
        <button
          onClick={() => {
            router.replace("/");
            router.refresh();
          }}
          className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">PwnIt account</div>
      <h1 className="mt-2 text-2xl font-black text-slate-950">Verify your email</h1>
      <p className="mt-3 text-sm text-slate-600">
        Enter the code we emailed you. Codes expire after 15 minutes.
      </p>

      <div className="mt-6 space-y-4">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="ABCD2345"
          autoComplete="one-time-code"
          inputMode="text"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-center text-lg font-bold tracking-[0.3em] text-slate-900 outline-none transition focus:border-slate-900"
        />

        {notice ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{notice}</div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
        ) : null}

        <button
          onClick={verify}
          disabled={busy || code.length < 4}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {busy ? "Verifying…" : "Verify email"}
        </button>

        <button
          onClick={resend}
          disabled={busy}
          type="button"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
        >
          Resend code
        </button>
      </div>
    </div>
  );
}
