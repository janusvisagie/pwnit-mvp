import type { Metadata } from "next";

import "./globals.css";

import HeaderNav, { HeaderNav as HeaderNavNamed } from "@/components/HeaderNav";
import { DemoUserSwitcherShell } from "@/components/DemoUserSwitcherShell";
import { CreditsPill } from "@/components/CreditsPill";

export const metadata: Metadata = {
  title: "PwnIt",
  description: "Pick. Play. PwnIt.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const Nav = (HeaderNav as any) || (HeaderNavNamed as any);

  return (
    <html lang="en">
      <body className="min-h-dvh overflow-x-hidden text-slate-900 antialiased">
        <div className="flex min-h-dvh flex-col">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto w-full max-w-7xl px-4 py-3 lg:px-8 lg:py-2.5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
                  <div className="text-sm font-semibold leading-tight text-slate-900 sm:text-base">
                    Pick. Play.{" "}
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-2xl font-black text-transparent">
                      PwnIt
                    </span>
                    .
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <DemoUserSwitcherShell />
                    <CreditsPill />
                  </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                  <Nav />
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-4 lg:px-8 lg:py-3">{children}</main>

          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto w-full max-w-7xl px-4 py-3 lg:px-8 lg:py-2.5">
              <div className="flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-semibold text-slate-900">Contact</div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                  <span>
                    WhatsApp: <span className="font-semibold text-slate-900">+27 00 000 0000</span> (demo)
                  </span>
                  <span>
                    Email: <span className="font-semibold text-slate-900">support@pwnit.local</span> (demo)
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
