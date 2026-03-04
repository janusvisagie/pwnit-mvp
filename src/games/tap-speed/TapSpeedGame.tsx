"use client";

import { useState } from "react";

export default function TapSpeedGame({ onFinish, disabled }: any) {
  const [phase, setPhase] = useState<"idle"|"wait"|"go">("idle");
  const [start, setStart] = useState<number>(0);

  function begin() {
    if (disabled) return;
    setPhase("wait");
    const delay = 800 + Math.random() * 2000;
    setTimeout(() => {
      setStart(Date.now());
      setPhase("go");
    }, delay);
  }

  function tap() {
    if (phase !== "go") return;
    const ms = Date.now() - start;
    onFinish({ scoreMs: ms });
    setPhase("idle");
  }

  return (
    <div className="space-y-3 text-center">
      <div className="font-semibold">Tap when it turns green</div>

      {phase === "idle" && (
        <button className="rounded-xl bg-slate-900 px-6 py-3 text-white font-bold"
          onClick={begin}>Start</button>
      )}

      {phase === "wait" && (
        <div className="h-16 bg-red-400 rounded-xl flex items-center justify-center text-white font-bold">
          Wait…
        </div>
      )}

      {phase === "go" && (
        <button onClick={tap}
          className="h-16 w-full bg-green-500 rounded-xl text-white font-bold">
          TAP NOW
        </button>
      )}
    </div>
  );
}
