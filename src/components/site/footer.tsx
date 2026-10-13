import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-board text-chalk">
      <div className="grid wrap gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex items-start gap-4">
          <Image src="/logo.png" alt="" width={56} height={56} className="h-14 w-14 shrink-0" />
          <div>
            <p className="font-display text-xl font-semibold leading-snug">{site.name}</p>
            <p className="mt-2 max-w-xs text-chalk/75">{site.tagline}</p>
          </div>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2">
          <p className="font-display text-lg font-semibold">Explore</p>
          <Link href="/" className="link-grow w-fit text-chalk/80 hover:text-chalk">Home</Link>
          <Link href="/about" className="link-grow w-fit text-chalk/80 hover:text-chalk">About</Link>
          <Link href="/academics" className="link-grow w-fit text-chalk/80 hover:text-chalk">Academics</Link>
          <Link href="/admissions" className="link-grow w-fit text-chalk/80 hover:text-chalk">Admissions</Link>
          <Link href="/news" className="link-grow w-fit text-chalk/80 hover:text-chalk">News</Link>
          <Link href="/contact" className="link-grow w-fit text-chalk/80 hover:text-chalk">Contact</Link>
          <Link href="/login" className="link-grow w-fit text-chalk/80 hover:text-chalk">Portal login</Link>
        </nav>

        <div className="flex flex-col gap-2 text-chalk/80">
          <p className="font-display text-lg font-semibold text-chalk">Contact</p>
          {site.address && <p>{site.address}</p>}
          <a href={site.phoneHref} className="link-grow w-fit hover:text-chalk">{site.phone}</a>
          <a href={site.whatsappHref} className="link-grow w-fit hover:text-chalk">WhatsApp</a>
          <a href={`mailto:${site.email}`} className="link-grow w-fit hover:text-chalk">{site.email}</a>
        </div>
      </div>
      <div className="border-t border-chalk/15">
        <p className="wrap py-4 text-sm text-chalk/60">
          © {new Date().getFullYear()} {site.name}. This is a test site with demo data.
        </p>
      </div>
    </footer>
  );
}
