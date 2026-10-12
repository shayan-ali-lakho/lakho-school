import Link from "next/link";
import { site } from "@/lib/site";

const highlights = [
  { title: "Qualified teachers", text: "A caring, experienced faculty focused on every child." },
  { title: "Modern learning", text: "Clear curriculum, regular assessment and progress tracking." },
  { title: "Parent connection", text: "Results, attendance and notices available in the parent portal." },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white text-zinc-900">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">{site.name}</span>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#about" className="text-zinc-600 hover:text-zinc-900">About</a>
            <a href="#contact" className="text-zinc-600 hover:text-zinc-900">Contact</a>
            <Link
              href="/login"
              className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
            >
              Portal login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-emerald-50">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {site.tagline}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-zinc-600">
              Welcome to {site.name}. This is the test version of our new website and school
              portal.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href="/login"
                className="rounded-md bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800"
              >
                Student / parent / staff login
              </Link>
              <a
                href="#contact"
                className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 font-medium hover:bg-zinc-50"
              >
                Contact us
              </a>
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">About the school</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {highlights.map((h) => (
              <div key={h.title} className="rounded-lg border border-zinc-200 p-5">
                <h3 className="font-medium">{h.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">{h.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="border-t border-zinc-200 bg-zinc-50">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight">Contact</h2>
            <dl className="mt-6 space-y-2 text-zinc-700">
              <div><dt className="inline font-medium">Address: </dt><dd className="inline">{site.address}</dd></div>
              <div><dt className="inline font-medium">Phone: </dt><dd className="inline">{site.phone}</dd></div>
              <div><dt className="inline font-medium">Email: </dt><dd className="inline">{site.email}</dd></div>
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} {site.name}. Test site, demo data only.
      </footer>
    </div>
  );
}
