"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function PortalBack() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const parent = parts.length > 2 && parts[1] !== "admin" ? "/" + parts.slice(0, -1).join("/") : "/portal";
  return (
    <Link href={pathname === "/portal" ? "/" : parent} className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 19-7-7 7-7M5 12h14"/></svg>
      {pathname === "/portal" ? "Back to website" : "Back"}
    </Link>
  );
}
