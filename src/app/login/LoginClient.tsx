"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginClientProps = {
  nextPath: string;
};

export default function LoginClient({ nextPath }: LoginClientProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [message, setMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  async function requestCode() {
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setMessage(data?.error || "Could not send sign-in code.");
        return;
      }

      setStep("verify");
      setDevCode(data?.devCode ? String(data.devCode) : null);
      setMessage(`We sent a sign-in code to ${data.email}.`);
    } catch (error: any) {
      setMessage(error?.message || "Could not send sign-in code.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code, next: nextPath }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setMessage(data?.error || "Could not verify code.");
        return;
      }

      window.dispatchEvent(new Event("pwnit:userChanged"));
      window.dispatchEvent(new Event("pwnit:credits"));
      router.push(data.redirectTo || nextPath);
      router.refresh();
    } catch (error: any) {
      setMessage(error?.message || "Could not verify code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900">Sign in</h1>
        <p className="text-sm text-slate-600">
          You can still browse and play as a guest. Sign-in is for purchases, prize claims, and saving your account.
        </p>
      </div>

      <label className="space-y-2 text-sm font-semibold text-slate-900">
        <span>Email address</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
        />
      </label>

      {step === "verify" ? (
        <label className="space-y-2 text-sm font-semibold text-slate-900">
          <span>6-digit code</span>
          <input
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
          />
        </label>
      ) : null}

      {message ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</div> : null}

      {devCode ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Dev sign-in code: <span className="font-black tracking-widest">{devCode}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step === "request" ? (
          <button
            type="button"
            onClick={requestCode}
            disabled={busy || !email.trim()}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Sending…" : "Email me a code"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={verifyCode}
              disabled={busy || code.length !== 6}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Verify code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setCode("");
                setDevCode(null);
                setMessage(null);
              }}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Change email
            </button>
          </>
        )}

        <Link
          href={nextPath}
          className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          Continue as guest
        </Link>
      </div>
    </div>
  );
}
