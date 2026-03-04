"use client";
import { useState } from "react";

export default function TapPatternGame({ onFinish, disabled }: any) {
  const pattern = ["L","R","L","L"];
  const [idx,setIdx]=useState(0);

  function tap(side:string){
    if(disabled)return;

    if(side===pattern[idx]){
      if(idx===pattern.length-1){
        onFinish({scoreMs:0});
      }else setIdx(idx+1);
    }else{
      onFinish({scoreMs:500});
    }
  }

  return (
    <div className="flex gap-4 justify-center">
      <button onClick={()=>tap("L")} className="bg-slate-900 text-white px-6 py-4 rounded-xl">L</button>
      <button onClick={()=>tap("R")} className="bg-slate-900 text-white px-6 py-4 rounded-xl">R</button>
    </div>
  );
}