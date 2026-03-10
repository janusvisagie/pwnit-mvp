"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-lg font-extrabold text-slate-900">Something went wrong.</div>
        <p className="mt-2 text-sm text-slate-600">Please try again. If the problem keeps happening, head back home and reopen the prize.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button onClick={() => reset()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white">Try again</button>
          <a href="/" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900">Back to home</a>
        </div>
      </div>
    </main>
  );
}
