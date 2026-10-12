import Link from "next/link";
import { site } from "@/lib/site";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/#admissions", label: "Admissions" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-paper-rule bg-paper">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-4">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight text-ink">
          {site.name}
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-x-6 gap-y-2 font-body text-base">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink-soft hover:text-ink hover:underline">
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-sm bg-board px-4 py-2 font-medium text-chalk hover:bg-[#2a4d44]"
          >
            Portal login
          </Link>
        </nav>
      </div>
    </header>
  );
}
