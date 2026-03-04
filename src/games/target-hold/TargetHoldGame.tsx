"use client";
import { useRef, useState } from "react";

export default function TargetHoldGame({ onFinish, disabled }: any) {
  const TARGET = 1500;
  const start = useRef<number|null>(null);
  const [holding, setHolding] = useState(false);

  function down(){
    if(disabled)return;
    start.current = Date.now();
    setHolding(true);
  }

  function up(){
    if(!holding || start.current==null)return;
    const ms = Date.now()-start.current;
    onFinish({scoreMs:Math.abs(ms-TARGET)});
    setHolding(false);
  }

  return (
    <button
      onMouseDown={down}
      onMouseUp={up}
      className="w-full h-20 bg-slate-900 text-white rounded-xl font-bold"
    >
      {holding ? "Release!" : "Hold 1.5s"}
    </button>
  );
}