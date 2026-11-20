"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
export function GridFilters(){
 const pathname=usePathname();
 useEffect(()=>{
  const root=document.querySelector(".school-portal main");if(!root)return;
  const tables=Array.from(root.querySelectorAll<HTMLTableElement>("table")).filter(t=>!t.closest("#pdf-card-root")&&!t.closest("[role=dialog]"));
  const cleanups:(()=>void)[]=[];
  for(const table of tables){
   if(table.closest("[data-custom-grid]"))continue;
   const headers=Array.from(table.querySelectorAll("thead th")).map(h=>h.textContent?.trim()??"");
   const rows=()=>Array.from(table.querySelectorAll<HTMLTableRowElement>("tbody tr"));
   if(!headers.length||!rows().length)continue;
   const bar=document.createElement("div");bar.className="portal-grid-tools";bar.setAttribute("role","search");
   const search=document.createElement("input");search.placeholder="Search records...";search.setAttribute("aria-label","Search table");search.className="portal-grid-search";bar.append(search);
   const options=document.createElement("select");options.className="portal-grid-select";options.setAttribute("aria-label","Filter column");options.append(new Option("All columns","all"));
   headers.forEach((h,i)=>{if(h)options.append(new Option(h,String(i)))});
   bar.append(options);const value=document.createElement("input");value.placeholder="Filter value...";value.setAttribute("aria-label","Column filter value");value.className="portal-grid-search";bar.append(value);
   const apply=()=>{for(const tr of rows()){const cells=Array.from(tr.cells);const text=tr.textContent?.toLowerCase()??"";const chosen=options.value==="all"?text:(cells[Number(options.value)]?.textContent?.toLowerCase()??"");tr.hidden=!(text.includes(search.value.toLowerCase())&&chosen.includes(value.value.toLowerCase()));}};
   for(const el of [search,options,value])el.addEventListener("input",apply);
   const container=table.parentElement;if(container){container.parentElement?.insertBefore(bar,container);cleanups.push(()=>{bar.remove();rows().forEach(tr=>tr.hidden=false)})}
  }
  return()=>cleanups.forEach(f=>f());
 },[pathname]);
 return null;
}
