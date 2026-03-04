// src/components/DemoUserSwitcher.tsx
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

    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-[12px] font-semibold text-slate-600">Demo user</div>
      <select
        value={val}
        onChange={(e) => setDemo(e.target.value)}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
      >
        <option value="demo1">demo1</option>
        <option value="demo2">demo2</option>
        <option value="demo3">demo3</option>
      </select>
    </div>
  );
}
