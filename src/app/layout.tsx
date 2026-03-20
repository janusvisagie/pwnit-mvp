import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";
import { AuthStatusShell } from "@/components/AuthStatusShell";
import { CreditsPill } from "@/components/CreditsPill";
import HeaderNav, { HeaderNav as HeaderNavNamed } from "@/components/HeaderNav";

export const metadata: Metadata = {
  title: "PwnIt",
  description: "Pick. Play. PwnIt.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const Nav = (HeaderNav as any) || (HeaderNavNamed as any);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <header className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <Link href="/" className="min-w-0">
                <div className="flex flex-wrap items-end gap-x-2 leading-none text-slate-900">
                  <span className="text-lg font-extrabold tracking-tight">Pick.</span>
                  <span className="text-lg font-extrabold tracking-tight">Play.</span>
                  <span className="text-2xl font-black tracking-tight">PwnIt.</span>
                </div>
              </Link>

              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <CreditsPill />
                <AuthStatusShell />
              </div>
            </div>

            <Nav />
          </header>
        </div>

        {children}

        <footer className="mt-10 border-t border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>Pick. Play. PwnIt.</p>
            <div className="flex gap-4">
              <Link href="/how-activation-works" className="hover:text-slate-900">
                How it works
              </Link>
              <Link href="/terms" className="hover:text-slate-900">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
