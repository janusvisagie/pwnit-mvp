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
            <div className="mx-auto w-full max-w-[1920px] px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 xl:px-8">
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

          <main className="mx-auto flex w-full max-w-[1920px] flex-1 px-3 py-3 sm:px-4 sm:py-3.5 lg:px-6 lg:py-4 xl:px-8 xl:py-5">
            <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
          </main>

          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto w-full max-w-[1920px] px-3 py-2 text-[11px] text-slate-600 sm:px-4 sm:text-xs lg:px-6 xl:px-8">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-semibold text-slate-900">Contact</div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-5">
                  <span>WhatsApp: +27 00 000 0000 (demo)</span>
                  <span>Email: support@pwnit.local (demo)</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
