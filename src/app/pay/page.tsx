import { Suspense } from "react";

import PayClient from "./PayClient";

export const dynamic = "force-dynamic";

function PayFallback() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900">Payment</h1>
        <p className="text-sm text-slate-600">Loading payment page…</p>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<PayFallback />}>
      <PayClient />
    </Suspense>
  );
}
