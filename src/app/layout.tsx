import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";
import { AuthStatusShell } from "@/components/AuthStatusShell";
import { CreditsPill } from "@/components/CreditsPill";
import HeaderNav from "@/components/HeaderNav";

export const metadata: Metadata = {
  title: "PwnIt",
  description: "Pick. Play. PwnIt.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-3 md:gap-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link href="/" className="shrink-0 leading-none">
                    <span className="text-lg font-semibold text-slate-700 sm:text-xl">Pick. Play.</span>{" "}
                    <span className="text-2xl font-black text-sky-600 sm:text-3xl">PwnIt.</span>
                  </Link>

                  <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                    <CreditsPill />
                    <AuthStatusShell />
                  </div>
                </div>

                <HeaderNav />
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <div className="leading-none">
                <span className="font-semibold text-slate-700">Pick. Play.</span>{" "}
                <span className="font-black text-sky-600">PwnIt.</span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link href="/how-activation-works" className="hover:text-slate-900">
                  How it works
                </Link>
                <Link href="/terms" className="hover:text-slate-900">
                  Terms
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
