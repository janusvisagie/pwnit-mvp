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
          <header className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white shadow-sm">
                  P
                </div>
                <div>
                  <div className="text-lg font-black tracking-tight text-slate-900">PwnIt</div>
                  <div className="text-xs text-slate-500">Pick. Play. PwnIt.</div>
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
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <div>Contact</div>
            <div className="text-xs sm:text-sm">WhatsApp: +27 00 000 0000 (demo) · Email: support@pwnit.local (demo)</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
