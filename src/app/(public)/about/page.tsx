import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${site.name}: our story, what we believe and a message from the principal.`,
};

const beliefs = [
  {
    title: "Every child is known",
    text: "Teachers learn each student's strengths and struggles, and act on them early.",
  },
  {
    title: "Clear expectations",
    text: "Students know what is expected of them in class, in homework and in behaviour.",
  },
  {
    title: "Honest communication with families",
    text: "Parents hear about progress and problems directly, not only at the end of the term.",
  },
  {
    title: "Respect in every classroom",
    text: "Students, teachers and staff treat each other with courtesy, every day.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-14 sm:pt-20">
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          About {site.name}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
          We are a school that wants children to learn well, behave kindly and feel looked after, and wants
          their families to see how that is going.
        </p>
      </section>

      <section className="border-t border-paper-rule">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-[15rem_1fr] md:gap-12">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Our story</h2>
          <div className="max-w-prose space-y-5 text-lg leading-relaxed">
            <p>
              {site.name} was started to give families in our community a dependable school close to home,
              where children are taught well and taught to treat others well.
            </p>
            <p>
              We keep our focus on the basics: good teaching, regular assessment and steady contact with
              parents. The new website and portal are part of that, so families can find information and
              school notices in one place.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-paper-rule bg-white">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-[15rem_1fr] md:gap-12">
          <h2 className="font-display text-3xl font-semibold tracking-tight">What we believe</h2>
          <dl className="divide-y divide-paper-rule border-y border-paper-rule">
            {beliefs.map((b) => (
              <div key={b.title} className="grid gap-1 py-5 sm:grid-cols-[14rem_1fr] sm:gap-8">
                <dt className="font-display text-xl font-semibold">{b.title}</dt>
                <dd className="max-w-prose leading-relaxed text-ink-soft">{b.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-paper-rule">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-[15rem_1fr] md:gap-12">
          <h2 className="font-display text-3xl font-semibold tracking-tight">From the principal</h2>
          <figure className="max-w-prose">
            <blockquote className="font-display text-2xl leading-snug">
              Our job is simple to say and hard to do: help every child learn, and tell their parents the truth
              about how they are doing.
            </blockquote>
            <figcaption className="mt-4 text-ink-soft">{site.principalName}, Principal</figcaption>
          </figure>
        </div>
      </section>

      <section className="bg-board text-chalk">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-8 px-6 py-14">
          <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight">
            Come and see the school for yourself
          </h2>
          <Link
            href="/#admissions"
            className="rounded-sm bg-chalk px-6 py-3 text-lg font-medium text-board hover:bg-white"
          >
            How to apply
          </Link>
        </div>
      </section>
    </>
  );
}
