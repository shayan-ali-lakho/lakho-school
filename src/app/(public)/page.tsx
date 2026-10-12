import Link from "next/link";
import { site } from "@/lib/site";

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

export default function Home() {
  return (
    <>
      {/* Hero: ruled notebook paper, a red margin line, one red-pen note */}
      <section className="notebook relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-y-0 w-px bg-pen/60 left-[max(0.75rem,calc((100%-64rem)/2+0.75rem))]"
        />
        <div className="mx-auto max-w-5xl px-6 pb-24 pt-14 sm:pt-20">
          <p className="relative flex h-16 w-80 -rotate-2 items-center justify-center font-hand text-3xl text-pen">
            <svg
              aria-hidden
              viewBox="0 0 320 64"
              fill="none"
              className="pen-circle absolute inset-0 h-full w-full"
            >
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

          <h1 className="mt-8 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            {site.tagline}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            {site.name} gives children a steady, caring place to learn, and keeps parents closely informed
            about how they are doing.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/#admissions"
              className="rounded-sm bg-ink px-6 py-3 text-lg font-medium text-paper hover:bg-[#2a3753]"
            >
              Apply for admission
            </Link>
            <Link href="/login" className="text-lg text-ink underline underline-offset-4 hover:text-pen">
              Sign in to the portal
            </Link>
          </div>
        </div>
      </section>

      {/* What children study */}
      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-20 md:grid-cols-[15rem_1fr] md:gap-12">
        <h2 className="font-display text-3xl font-semibold tracking-tight">What children study</h2>
        <dl className="divide-y divide-paper-rule border-y border-paper-rule">
          {stages.map((s) => (
            <div key={s.name} className="grid gap-1 py-6 sm:grid-cols-[11rem_1fr] sm:gap-8">
              <dt className="font-display text-xl font-semibold">
                {s.name}
                <span className="block font-body text-base font-normal text-ink-soft">{s.classes}</span>
              </dt>
              <dd className="max-w-prose leading-relaxed text-ink-soft">{s.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* A day at school: a real sequence, so times lead each row */}
      <section className="border-t border-paper-rule bg-white">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-20 md:grid-cols-[15rem_1fr] md:gap-12">
          <h2 className="font-display text-3xl font-semibold tracking-tight">A day at school</h2>
          <ol className="divide-y divide-paper-rule border-y border-paper-rule">
            {day.map((d) => (
              <li key={d.time} className="grid grid-cols-[5rem_1fr] items-baseline gap-4 py-4">
                <span className="font-display text-xl font-semibold tabular-nums">{d.time}</span>
                <span className="text-lg">{d.what}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Portal: the blackboard */}
      <section className="bg-board text-chalk">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-8 px-6 py-16">
          <div className="max-w-xl">
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
            className="rounded-sm bg-chalk px-6 py-3 text-lg font-medium text-board hover:bg-white"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Admissions */}
      <section id="admissions" className="mx-auto grid max-w-5xl gap-8 px-6 py-20 md:grid-cols-[15rem_1fr] md:gap-12">
        <h2 className="font-display text-3xl font-semibold tracking-tight">How to apply</h2>
        <ol className="divide-y divide-paper-rule border-y border-paper-rule">
          {steps.map((step, i) => (
            <li key={step} className="grid grid-cols-[3rem_1fr] items-baseline gap-4 py-5">
              <span className="font-display text-3xl font-semibold text-pen">{i + 1}</span>
              <span className="text-lg">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-paper-rule bg-white">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-20 md:grid-cols-[15rem_1fr] md:gap-12">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Contact us</h2>
          <dl className="divide-y divide-paper-rule border-y border-paper-rule">
            {[
              ["Address", site.address],
              ["Phone", site.phone],
              ["Email", site.email],
              ["Office hours", site.hours],
            ].map(([label, value]) => (
              <div key={label} className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <dt className="text-ink-soft">{label}</dt>
                <dd className="text-lg">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
