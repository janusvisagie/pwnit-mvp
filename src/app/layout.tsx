import type { Metadata } from "next";
import Link from "next/link";

import { AuthStatusShell } from "@/components/AuthStatusShell";
import HeaderNav from "@/components/HeaderNav";

import "./globals.css";

export const metadata: Metadata = {
  title: "PwnIt",
  description: "Pick a prize, play a quick skill game, and win it — or buy it at a fair price.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f5efe7] text-slate-950 antialiased">
        <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80 bg-gradient-to-br from-[#ead7c3] via-[#f8f1e9] to-[#dce9df]" />
        <div className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-72 bg-gradient-to-tr from-[#f2e6d9] via-transparent to-[#e4eee6]" />
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 sm:px-4 sm:py-4">
          <header className="mb-3 rounded-[1.5rem] border border-[#ded0c0] bg-[#fffaf3]/95 p-3 shadow-sm backdrop-blur sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-baseline gap-1.5 text-lg font-black tracking-tight text-[#2f3a32]">
                  <span>Pick. Play.</span>
                  <Link href="/" aria-label="PwnIt home" className="transition hover:text-[#3f4d43]">
                    PwnIt.
                  </Link>
                </span>
                <div className="lg:hidden">
                  <AuthStatusShell />
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <HeaderNav />
                <div className="hidden lg:block">
                  <AuthStatusShell />
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1">{children}</div>

          <footer className="mt-3 rounded-[1.5rem] border border-[#ded0c0] bg-[#fffaf3]/95 px-4 py-3 text-center text-xs font-bold text-[#75695f] shadow-sm backdrop-blur sm:text-sm">
            <div>Pick. Play. PwnIt. · WhatsApp: +27 60 123 4567 · hello@pwnit.co.za</div>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <Link href="/legal/terms" className="underline-offset-2 transition hover:text-[#3f4d43] hover:underline">
                Terms
              </Link>
              <span aria-hidden>·</span>
              <Link href="/legal/refund" className="underline-offset-2 transition hover:text-[#3f4d43] hover:underline">
                Refunds
              </Link>
              <span aria-hidden>·</span>
              <Link href="/legal/privacy" className="underline-offset-2 transition hover:text-[#3f4d43] hover:underline">
                Privacy
              </Link>
              <span className="text-[#a89a8c]">· Draft, under review</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
