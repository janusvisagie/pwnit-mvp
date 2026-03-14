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
    <select
      value={val}
      onChange={(e) => setDemo(e.target.value)}
      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
      aria-label="Demo user"
    >
      <option value="demo1">demo1@maketiyours.local</option>
      <option value="demo2">demo2@maketiyours.local</option>
      <option value="demo3">demo3@maketiyours.local</option>
    </select>
  );
}

export default DemoUserSwitcher;
