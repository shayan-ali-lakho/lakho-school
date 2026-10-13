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

  const isActive = (href: string) => (href === "/portal" ? pathname === href : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Portal" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">{g.label}</p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(i.href) ? "page" : undefined}
                  className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive(i.href)
                      ? "bg-emerald-50 font-medium text-emerald-800"
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
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
        <Link href="/portal" className="font-semibold tracking-tight">
          {title}
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="portal-drawer"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
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
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <Link href="/portal" className="font-semibold leading-tight tracking-tight">
            {title}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100 lg:hidden"
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
