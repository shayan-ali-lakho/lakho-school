"use client";

import Link from "next/link";
import { Icon, iconForHref } from "@/components/portal/dash";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";

const preferenceKey = "lakho-sidebar-collapsed";
const subscribe = (notify: () => void) => { window.addEventListener("storage", notify); window.addEventListener("lakho-sidebar", notify); return () => { window.removeEventListener("storage", notify); window.removeEventListener("lakho-sidebar", notify); }; };
const snapshot = () => { try { return localStorage.getItem(preferenceKey) === "true"; } catch { return false; } };
const serverSnapshot = () => false;

type Group = { label: string; items: { href: string; label: string }[] };

/** Portal navigation: fixed sidebar on large screens, slide-in drawer on small ones. */
export function Sidebar({
  groups,
  title,
  footer,
}: {
  groups: Group[];
  title: string;
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const stored = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [fallback, setFallback] = useState<boolean | null>(null);
  const collapsed = fallback ?? stored;
  function toggle() { try { localStorage.setItem(preferenceKey, String(!collapsed)); window.dispatchEvent(new Event("lakho-sidebar")); } catch { setFallback(!collapsed); } }

  // The most specific matching link is the active one (so /portal/fees/structure does not also light up /portal/fees).
  const activeHref = groups
    .flatMap((g) => g.items.map((i) => i.href))
    .filter((h) => (h === "/portal" ? pathname === h : pathname === h || pathname.startsWith(`${h}/`)))
    .sort((a, b) => b.length - a.length)[0];
  const isActive = (href: string) => href === activeHref;

  const nav = (
    <nav aria-label="Portal" className={`flex-1 space-y-5 overflow-y-auto px-4 py-5 ${collapsed ? "lg:px-2" : ""}`}>
      {groups.map((g) => (
        <div key={g.label}>
          <p className={`px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 ${collapsed ? "lg:sr-only" : ""}`}>{g.label}</p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  onClick={() => setOpen(false)}
                  title={i.label}
                  aria-label={i.label}
                  aria-current={isActive(i.href) ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${collapsed ? "lg:justify-center lg:px-0" : ""} ${
                    isActive(i.href)
                      ? "bg-[#dce7fb] font-semibold text-[#263b60]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon name={iconForHref(i.href)} className="size-[18px] shrink-0" />
                  <span className={collapsed ? "lg:hidden" : ""}>{i.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Small screens: top bar with menu button */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 text-slate-900 lg:hidden">
        <Link href="/portal" className="font-semibold tracking-tight">
          {title}
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="portal-drawer"
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-900"
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-zinc-900/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}

      <aside
        id="portal-drawer"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-[width,transform] duration-200 motion-reduce:transition-none lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:shrink-0 lg:translate-x-0 ${collapsed ? "lg:w-20" : "lg:w-64"} ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`flex items-center justify-between border-b border-slate-100 bg-white px-5 py-5 text-slate-900 ${collapsed ? "lg:justify-center lg:px-2" : ""}`}>
          <Link href="/portal" className="flex items-center gap-3 text-sm font-semibold leading-tight tracking-tight">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#a6bdeb] text-slate-900"><Icon name="cap" /></span>
            <span className={collapsed ? "lg:hidden" : ""}>{title}</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            ✕
          </button>
        </div>
        <button type="button" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="absolute right-0 top-20 z-20 hidden size-8 translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-orange-50 hover:text-orange-700 lg:flex"><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d={collapsed ? "m13 9 3 3-3 3" : "m16 9-3 3 3 3"}/></svg></button>
        {nav}
        <div className={`border-t border-zinc-200 p-4 ${collapsed ? "lg:p-2 lg:[&_.sidebar-profile]:hidden lg:[&_.sidebar-signout-label]:hidden lg:[&_.sidebar-signout-icon]:block lg:[&_.sidebar-footer]:p-1" : ""}`}>{footer}</div>
      </aside>
    </>
  );
}
