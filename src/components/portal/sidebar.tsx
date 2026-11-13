"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

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

  // The most specific matching link is the active one (so /portal/fees/structure does not also light up /portal/fees).
  const activeHref = groups
    .flatMap((g) => g.items.map((i) => i.href))
    .filter((h) => (h === "/portal" ? pathname === h : pathname === h || pathname.startsWith(`${h}/`)))
    .sort((a, b) => b.length - a.length)[0];
  const isActive = (href: string) => href === activeHref;

  const nav = (
    <nav aria-label="Portal" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-brand-700">{g.label}</p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(i.href) ? "page" : undefined}
                  className={`block rounded-md px-3 py-2 text-sm transition-all duration-200 hover:translate-x-0.5 ${
                    isActive(i.href)
                      ? "bg-brand-50 font-medium text-brand-800 shadow-[inset_3px_0_0_var(--saffron)]"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  {i.label}
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
      <div className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 text-white lg:hidden">
        <Link href="/portal" className="font-semibold tracking-tight">
          {title}
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="portal-drawer"
          className="rounded-md border border-white/40 px-3 py-1.5 text-sm text-white"
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-zinc-900/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}

      <aside
        id="portal-drawer"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b-4 border-saffron bg-ink px-5 py-4 text-white">
          <Link href="/portal" className="font-semibold leading-tight tracking-tight">
            {title}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-md px-2 py-1 text-white/80 hover:bg-white/10 lg:hidden"
          >
            ✕
          </button>
        </div>
        {nav}
        <div className="border-t border-zinc-200 p-4">{footer}</div>
      </aside>
    </>
  );
}
