import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/academics", label: "Academics" },
  { href: "/admissions", label: "Admissions" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-30 border-b border-paper-rule bg-paper/90 backdrop-blur">
      <div className="flex wrap flex-wrap items-center justify-between gap-x-8 gap-y-2 py-3">
        <Link href="/" className="group flex items-center gap-3 text-ink">
          <Image
            src="/logo.png"
            alt=""
            width={48}
            height={48}
            className="h-11 w-11 transition-transform duration-500 ease-out group-hover:rotate-[12deg] group-hover:scale-105"
          />
          <span className="font-display text-lg font-semibold leading-tight tracking-tight">
            <span className="hidden sm:inline">{site.name}</span>
            <span className="sm:hidden">{site.shortName}</span>
          </span>
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-x-6 gap-y-2 font-body text-base">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="link-grow text-ink-soft hover:text-ink">
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-sm bg-board px-4 py-2 font-medium text-chalk transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2a4d44] hover:shadow-md active:translate-y-0"
          >
            Portal login
          </Link>
        </nav>
      </div>
    </header>
  );
}
