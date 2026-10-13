import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Academics",
  description: `Classes 1 to 10 at ${site.name}: what children study and how progress is checked.`,
};

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

const subjects = ["English", "Urdu", "Mathematics", "Islamiyat", "General Science", "Social Studies", "Computer Studies"];

const assessment = [
  { title: "Class tests", text: "Short tests through the term show quickly where a child needs help." },
  { title: "Term examinations", text: "Written examinations at the end of each term, marked and reported to parents." },
  { title: "Progress reports", text: "Parents see their child's results and notices on the school portal." },
];

export default function AcademicsPage() {
  return (
    <>
      <PageHero title="Academics">Classes 1 to 10, with regular assessment and clear reports to parents.</PageHero>

      <section className="wrap grid gap-8 py-16 md:grid-cols-[15rem_1fr] md:gap-12">
        <h2 className="reveal font-display text-3xl font-semibold tracking-tight">Stages</h2>
        <dl className="divide-y divide-paper-rule border-y border-paper-rule">
          {stages.map((s, i) => (
            <div
              key={s.name}
              style={{ "--i": i } as React.CSSProperties}
              className="reveal-row grid gap-1 py-6 transition-colors hover:bg-white sm:grid-cols-[11rem_1fr] sm:gap-8"
            >
              <dt className="font-display text-xl font-semibold">
                {s.name}
                <span className="block font-body text-base font-normal text-ink-soft">{s.classes}</span>
              </dt>
              <dd className="max-w-prose leading-relaxed text-ink-soft">{s.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-paper-rule bg-white">
        <div className="wrap grid gap-8 py-16 md:grid-cols-[15rem_1fr] md:gap-12">
          <h2 className="reveal font-display text-3xl font-semibold tracking-tight">Subjects</h2>
          <ul className="flex flex-wrap gap-3">
            {subjects.map((s, i) => (
              <li
                key={s}
                style={{ "--i": i } as React.CSSProperties}
                className="reveal lift rounded-sm border border-paper-rule border-b-4 border-b-saffron bg-paper px-5 py-3 text-lg"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap grid gap-8 py-16 md:grid-cols-[15rem_1fr] md:gap-12">
        <h2 className="reveal font-display text-3xl font-semibold tracking-tight">How progress is checked</h2>
        <ul className="grid gap-5 sm:grid-cols-3">
          {assessment.map((a, i) => (
            <li
              key={a.title}
              style={{ "--i": i } as React.CSSProperties}
              className="reveal lift rounded-sm border border-paper-rule bg-white p-5"
            >
              <h3 className="font-display text-xl font-semibold">{a.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{a.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-board text-chalk">
        <div className="wrap flex flex-wrap items-center justify-between gap-8 py-14">
          <h2 className="reveal max-w-xl font-display text-3xl font-semibold tracking-tight">
            Ready to join us?
          </h2>
          <Link
            href="/admissions"
            className="reveal rounded-sm bg-chalk px-6 py-3 text-lg font-medium text-board transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
          >
            Apply for admission
          </Link>
        </div>
      </section>
    </>
  );
}
