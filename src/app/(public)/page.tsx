import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { site } from "@/lib/site";

// Public notices are read from the database; refresh them every five minutes.
export const revalidate = 300;

const highlights = [
  {
    title: "Teachers who know your child",
    text: "Every student is known by name, and teachers act early when a child needs help.",
  },
  {
    title: "Regular tests, honest reports",
    text: "Progress is checked often and reported plainly, not only at the end of the term.",
  },
  {
    title: "Notices in one place",
    text: "School announcements and your child's profile are available on the parent and student portal.",
  },
  {
    title: "Order and respect",
    text: "Clear rules, courtesy in every classroom and a calm, orderly campus.",
  },
];

const stages = [
  {
    name: "Primary",
    classes: "Classes 1 to 5",
    text: "Reading, writing and number work come first, with Urdu, English and Islamiyat taught from the start.",
  },
  {
    name: "Middle",
    classes: "Classes 6 to 8",
    text: "Science, social studies and computer basics join the core subjects, and homework becomes a regular habit.",
  },
  {
    name: "Secondary",
    classes: "Classes 9 and 10",
    text: "Students prepare for their board examinations with subject teachers and regular tests.",
  },
];

const day = [
  { time: "8:00", what: "Morning assembly" },
  { time: "8:20", what: "First lessons" },
  { time: "10:30", what: "Break" },
  { time: "11:00", what: "More lessons" },
  { time: "12:45", what: "Activities and sports" },
  { time: "1:45", what: "Dismissal" },
];

const steps = [
  "Visit the school and meet the teachers.",
  "Fill in the admission form.",
  "Come in for a short meeting and assessment.",
  "Receive your offer and complete enrolment.",
];

const faqs = [
  {
    q: "Which classes can my child join?",
    a: "We teach Classes 1 to 10. Contact the office to check whether a place is open in the class you need.",
  },
  {
    q: "What do I bring when applying?",
    a: "Bring your child's birth certificate, recent photographs, and the previous school's result card if there is one.",
  },
  {
    q: "How will I see my child's progress?",
    a: "Parents receive a portal account to read school notices and open their child's profile. Attendance and results are being added.",
  },
  {
    q: "How do I pay fees?",
    a: "Fees are paid at the school office, and the office records each payment. Online payment is not available yet.",
  },
];

async function latestNotices() {
  try {
    return await db.announcement.findMany({
      where: { isPublic: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { id: true, title: true, body: true, publishedAt: true },
    });
  } catch (error) {
    // The home page must still load if the database is unreachable.
    console.error("Could not load public notices:", error);
    return [];
  }
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default async function Home() {
  const notices = await latestNotices();

  return (
    <>
      {/* Hero: ruled notebook paper, a red margin line, one red-pen note, the school crest */}
      <section className="notebook relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-y-0 w-px bg-pen/60 left-[max(0.75rem,calc((100%-64rem)/2+0.75rem))]"
        />
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 pb-24 pt-14 sm:pt-20 md:grid-cols-[1fr_20rem]">
          <div>
            <p className="rise relative flex h-16 w-80 whitespace-nowrap -rotate-2 items-center justify-center font-hand text-3xl text-pen">
              <svg aria-hidden viewBox="0 0 320 64" fill="none" className="pen-circle absolute inset-0 h-full w-full">
                <path
                  pathLength={1}
                  d="M24 36 C 10 10, 130 4, 205 7 S 312 20, 306 38 C 300 58, 180 62, 105 59 S 10 56, 18 32 C 22 20, 40 14, 60 11"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              {site.admissionsNote}
            </p>

            <h1
              className="rise mt-8 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl"
              style={{ "--d": 150 } as React.CSSProperties}
            >
              {site.tagline}
            </h1>
            <p
              className="rise mt-6 max-w-xl text-lg leading-relaxed text-ink-soft"
              style={{ "--d": 300 } as React.CSSProperties}
            >
              {site.name} gives children a steady, caring place to learn, and keeps parents closely informed
              about how they are doing.
            </p>
            <div
              className="rise mt-9 flex flex-wrap items-center gap-x-8 gap-y-4"
              style={{ "--d": 450 } as React.CSSProperties}
            >
              <Link
                href="/#admissions"
                className="rounded-sm bg-ink px-6 py-3 text-lg font-medium text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2a3753] hover:shadow-lg active:translate-y-0"
              >
                Apply for admission
              </Link>
              <Link href="/login" className="link-grow text-lg text-ink hover:text-pen">
                Sign in to the portal
              </Link>
            </div>
          </div>

          <div className="hero-logo mx-auto w-56 md:w-full">
            <div className="hero-logo-float">
              <Image
                src="/logo.png"
                alt={`${site.name} crest`}
                width={512}
                height={512}
                priority
                sizes="(min-width: 768px) 320px, 224px"
                className="h-auto w-full drop-shadow-[0_18px_30px_rgba(23,32,51,0.18)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why families choose us */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="reveal font-display text-3xl font-semibold tracking-tight">Why families choose us</h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {highlights.map((h, i) => (
            <li
              key={h.title}
              style={{ "--i": i } as React.CSSProperties}
              className="reveal lift rounded-sm border border-paper-rule border-t-4 border-t-saffron bg-white p-6"
            >
              <h3 className="font-display text-xl font-semibold">{h.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{h.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* What children study */}
      <section className="border-t border-paper-rule bg-white">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-20 md:grid-cols-[15rem_1fr] md:gap-12">
          <h2 className="reveal font-display text-3xl font-semibold tracking-tight">What children study</h2>
          <dl className="divide-y divide-paper-rule border-y border-paper-rule">
            {stages.map((s, i) => (
              <div
                key={s.name}
                style={{ "--i": i } as React.CSSProperties}
                className="reveal-row grid gap-1 py-6 transition-colors hover:bg-paper sm:grid-cols-[11rem_1fr] sm:gap-8"
              >
                <dt className="font-display text-xl font-semibold">
                  {s.name}
                  <span className="block font-body text-base font-normal text-ink-soft">{s.classes}</span>
                </dt>
                <dd className="max-w-prose leading-relaxed text-ink-soft">{s.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* A day at school: a real sequence, so times lead each row */}
      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-20 md:grid-cols-[15rem_1fr] md:gap-12">
        <h2 className="reveal font-display text-3xl font-semibold tracking-tight">A day at school</h2>
        <ol className="divide-y divide-paper-rule border-y border-paper-rule">
          {day.map((d, i) => (
            <li
              key={d.time}
              style={{ "--i": i } as React.CSSProperties}
              className="reveal-row grid grid-cols-[5rem_1fr] items-baseline gap-4 py-4 transition-colors hover:bg-white"
            >
              <span className="font-display text-xl font-semibold tabular-nums text-saffron">{d.time}</span>
              <span className="text-lg">{d.what}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Notices from the school (only shown when there are public ones) */}
      {notices.length > 0 && (
        <section className="border-t border-paper-rule bg-white">
          <div className="mx-auto grid max-w-5xl gap-8 px-6 py-20 md:grid-cols-[15rem_1fr] md:gap-12">
            <h2 className="reveal font-display text-3xl font-semibold tracking-tight">School notices</h2>
            <ul className="space-y-5">
              {notices.map((n, i) => (
                <li
                  key={n.id}
                  style={{ "--i": i } as React.CSSProperties}
                  className="reveal lift rounded-sm border border-paper-rule bg-paper p-6"
                >
                  <p className="text-sm text-ink-soft">{dateFormat.format(n.publishedAt)}</p>
                  <h3 className="mt-1 font-display text-xl font-semibold">{n.title}</h3>
                  <p className="mt-2 max-w-prose leading-relaxed text-ink-soft">{n.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Portal: the blackboard */}
      <section className="bg-board text-chalk">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-8 px-6 py-16">
          <div className="reveal max-w-xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Parents and students, sign in to the portal
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-chalk/80">
              Read notices from the school and open your child&apos;s profile. Results and attendance are coming
              next.
            </p>
          </div>
          <Link
            href="/login"
            className="reveal rounded-sm bg-chalk px-6 py-3 text-lg font-medium text-board transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg active:translate-y-0"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Admissions */}
      <section id="admissions" className="mx-auto grid max-w-5xl gap-8 px-6 py-20 md:grid-cols-[15rem_1fr] md:gap-12">
        <h2 className="reveal font-display text-3xl font-semibold tracking-tight">How to apply</h2>
        <div>
          <ol className="divide-y divide-paper-rule border-y border-paper-rule">
            {steps.map((step, i) => (
              <li
                key={step}
                style={{ "--i": i } as React.CSSProperties}
                className="reveal-row grid grid-cols-[3rem_1fr] items-baseline gap-4 py-5"
              >
                <span className="font-display text-3xl font-semibold text-pen">{i + 1}</span>
                <span className="text-lg">{step}</span>
              </li>
            ))}
          </ol>
          <p className="reveal mt-6 text-lg text-ink-soft">
            Call the office on <span className="text-ink">{site.phone}</span> or visit during office hours to
            begin.
          </p>
        </div>
      </section>

      {/* Questions */}
      <section className="border-t border-paper-rule bg-white">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-20 md:grid-cols-[15rem_1fr] md:gap-12">
          <h2 className="reveal font-display text-3xl font-semibold tracking-tight">Common questions</h2>
          <div className="divide-y divide-paper-rule border-y border-paper-rule">
            {faqs.map((f, i) => (
              <details key={f.q} style={{ "--i": i } as React.CSSProperties} className="reveal-row group py-1">
                <summary className="flex items-center justify-between gap-6 py-4 font-display text-xl font-semibold">
                  {f.q}
                  <span aria-hidden className="faq-icon text-3xl font-normal leading-none text-saffron">
                    +
                  </span>
                </summary>
                <p className="faq-answer max-w-prose pb-5 leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto grid max-w-5xl gap-8 px-6 py-20 md:grid-cols-[15rem_1fr] md:gap-12">
        <h2 className="reveal font-display text-3xl font-semibold tracking-tight">Contact us</h2>
        <dl className="divide-y divide-paper-rule border-y border-paper-rule">
          {[
            ["Address", site.address],
            ["Phone", site.phone],
            ["Email", site.email],
            ["Office hours", site.hours],
          ].map(([label, value], i) => (
            <div
              key={label}
              style={{ "--i": i } as React.CSSProperties}
              className="reveal-row grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6"
            >
              <dt className="text-ink-soft">{label}</dt>
              <dd className="text-lg">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
