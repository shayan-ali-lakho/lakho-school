"use client";
export function PrintCard(){return <button type="button" onClick={()=>window.print()} className="mb-6 rounded-lg bg-[#10264a] px-4 py-2 text-white print:hidden">Download PDF / Print</button>}
