import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-paper-rule bg-paper">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 font-body text-sm text-ink-soft">
        <p>
          © {new Date().getFullYear()} {site.name}. This is a test site with demo data.
        </p>
        <nav aria-label="Footer" className="flex gap-6">
          <Link href="/about" className="hover:text-ink hover:underline">
            About
          </Link>
          <Link href="/login" className="hover:text-ink hover:underline">
            Portal login
          </Link>
        </nav>
      </div>
    </footer>
  );
}
