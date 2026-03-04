"use client";
import { useEffect, useState } from "react";

export default function StopZeroGame({ onFinish, disabled }: any) {
  const [time,setTime]=useState(3000);
  const [run,setRun]=useState(false);

  useEffect(()=>{
    if(!run)return;
    const i=setInterval(()=>setTime(t=>t-16),16);
    return()=>clearInterval(i);
  },[run]);

  function stop(){
    setRun(false);
    onFinish({scoreMs:Math.abs(time)});
  }

  return (
    <div className="text-center space-y-3">
      <div className="text-3xl font-bold">{(time/1000).toFixed(2)}</div>
      {!run ?
        <button onClick={()=>setRun(true)} className="bg-slate-900 text-white px-5 py-2 rounded-xl">
          Start
        </button>
        :
        <button onClick={stop} className="bg-green-500 text-white px-5 py-2 rounded-xl">
          Stop at 0
        </button>}
    </div>
  );
}
