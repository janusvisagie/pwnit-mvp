"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DemoUserSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const [val, setVal] = useState(current);

  async function setDemo(demoKey: string) {
    setVal(demoKey);

    await fetch("/api/demo/switch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ demoKey }),
    });

    window.dispatchEvent(new Event("pwnit:userChanged"));
    window.dispatchEvent(new Event("pwnit:credits"));

    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-[12px] font-semibold text-slate-600 sm:block">Demo user</div>
      <select
        value={val}
        onChange={(e) => setDemo(e.target.value)}
        className="min-w-[102px] rounded-full border border-slate-200/80 bg-white px-3.5 py-2 text-sm font-bold text-slate-900 shadow-sm ring-1 ring-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-200"
        aria-label="Demo user"
      >
        <option value="demo1">demo1</option>
        <option value="demo2">demo2</option>
        <option value="demo3">demo3</option>
      </select>
    </div>
  );
}

export default DemoUserSwitcher;
