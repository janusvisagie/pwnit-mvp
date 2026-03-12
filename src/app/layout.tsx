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
      <body className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto w-full max-w-[1500px] px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
                  <div className="text-[13px] font-semibold leading-tight text-slate-900 sm:text-sm">
                    Pick. Play. <span className="text-[19px] font-extrabold sm:text-lg">PwnIt</span>.
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <DemoUserSwitcherShell />
                    <CreditsPill />
                  </div>
                </div>

                <div className="-mx-1 overflow-x-auto px-1 lg:mx-0 lg:px-0">
                  <Nav />
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] flex-1 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6">
            {children}
          </main>

          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto w-full max-w-[1500px] px-3 py-2 text-[11px] text-slate-600 sm:px-4 sm:text-xs lg:px-6">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-semibold text-slate-900">Contact</div>
                <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
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
