"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
export type GlassOption = {label:string;value:string};
type Props={label:string;value:string;options:GlassOption[];onChange:(value:string)=>void};
export default function GlassSelect({label,value,options,onChange}:Props) {
  const [open,setOpen]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const refs=useRef<Array<HTMLButtonElement|null>>([]);
  const selected=Math.max(0, options.findIndex(o=>o.value===value));
  useEffect(()=>{
    if(!open)return;
    const onDown=(e:PointerEvent)=>{if(root.current&&!root.current.contains(e.target as Node))setOpen(false)};
    document.addEventListener("pointerdown",onDown);
    return()=>document.removeEventListener("pointerdown",onDown);
  },[open]);
  useEffect(()=>{if(open)refs.current[selected]?.focus()},[open,selected]);
  const choose=(v:string)=>{onChange(v);setOpen(false);trigger.current?.focus()};
  return <div className="glass-select relative min-w-0" ref={root}>
    <button ref={trigger} type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open}
      className="glass-input flex w-full items-center justify-between gap-2 text-left"
      onClick={()=>setOpen(!open)}
      onKeyDown={e=>{if(["ArrowDown","ArrowUp"," ","Enter"].includes(e.key)){e.preventDefault();setOpen(true)}}}>
      <span className="truncate">{options[selected]?.label ?? label}</span><ChevronDown size={16} className={`shrink-0 transition-transform ${open?'rotate-180':''}`}/>
    </button>
    {open&&<div role="listbox" aria-label={label} className="glass-dropdown absolute left-0 top-[calc(100%+8px)] z-50 max-h-64 w-max min-w-full overflow-auto rounded-2xl p-1.5 shadow-xl">
      {options.map((option,i)=><button key={option.value} ref={el=>{refs.current[i]=el}} type="button" role="option" aria-selected={option.value===value}
        className="glass-option flex w-full min-w-40 items-center justify-between gap-4 rounded-xl px-3 py-2 text-left text-sm"
        onClick={()=>choose(option.value)}
        onKeyDown={e=>{
          if(e.key==='Escape'){e.preventDefault();setOpen(false);trigger.current?.focus()}
          else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();refs.current[(i+(e.key==='ArrowDown'?1:options.length-1))%options.length]?.focus()}
          else if(e.key==='Home'){e.preventDefault();refs.current[0]?.focus()}
          else if(e.key==='End'){e.preventDefault();refs.current[options.length-1]?.focus()}
          else if(e.key===' '||e.key==='Enter'){e.preventDefault();choose(option.value)}
        }}>
        <span>{option.label}</span>{option.value===value&&<Check size={15} className="text-orange-500"/>}
      </button>)}
    </div>}
  </div>;
}
