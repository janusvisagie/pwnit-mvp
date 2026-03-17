import { Suspense } from "react";

import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

function LoginFallback() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900">Sign in</h1>
        <p className="text-sm text-slate-600">Loading sign-in form…</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}
