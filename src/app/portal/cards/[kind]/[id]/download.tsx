"use client";
import { useState } from "react";
export function DownloadCard({name,admit}:{name:string;admit:boolean}){
 const [busy,setBusy]=useState(false);
 async function download(){
  const element=document.getElementById("pdf-card-root");if(!element)return;
  setBusy(true);
  try{
   const [{default:html2canvas},{jsPDF}]=await Promise.all([import("html2canvas"),import("jspdf")]);
   const pages=Array.from(element.querySelectorAll<HTMLElement>(".identity,.admit"));
   const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:admit?"a4":[54,85.6]});
   for(let i=0;i<pages.length;i++){
    if(i)pdf.addPage(admit?"a4":[54,85.6],"portrait");
    const canvas=await html2canvas(pages[i],{scale:3,backgroundColor:"#ffffff",useCORS:true,logging:false});
    const w=pdf.internal.pageSize.getWidth(),h=pdf.internal.pageSize.getHeight();
    const ratio=Math.min(w/canvas.width,h/canvas.height);
    const drawW=canvas.width*ratio,drawH=canvas.height*ratio;
    pdf.addImage(canvas.toDataURL("image/png"),"PNG",(w-drawW)/2,(h-drawH)/2,drawW,drawH);
   }
   pdf.save(name.replace(/[^a-z0-9_-]/gi,"-")+(admit?"-admit":"-id")+".pdf");
  }catch(e){alert("PDF download failed. Please use Print / Save as PDF instead.");console.error(e)}
  finally{setBusy(false)}
 }
 return <button type="button" disabled={busy} onClick={download} className="mb-6 ml-2 rounded-lg bg-orange-600 px-4 py-2 text-white disabled:opacity-50 print:hidden">{busy?"Preparing PDF...":"Download PDF"}</button>;
}
