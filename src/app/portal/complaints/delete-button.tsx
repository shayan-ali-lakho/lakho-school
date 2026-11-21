"use client";
export function DeleteComplaintButton(){
 return <button type="submit" onClick={e=>{if(!window.confirm("Permanently delete this complaint? This cannot be undone."))e.preventDefault();}} className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Delete</button>;
}
