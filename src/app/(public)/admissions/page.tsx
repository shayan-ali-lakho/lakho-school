import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { PField, PSelect, PTextarea, PublicForm } from "@/components/site/public-form";
import { CLASS_OPTIONS, site } from "@/lib/site";
import { submitApplication } from "./actions";

export const metadata: Metadata = {
  title: "Admissions",
  description: `Apply online for admission to ${site.name}.`,
};

const steps = [
  "Fill in the application form.",
  "The school office calls you to arrange a visit.",
  "Meet the teachers and take a short assessment.",
  "Receive the school's decision and complete enrolment.",
];

const documents = [
  "Child's birth certificate (or B-Form)",
  "Two recent passport-size photographs",
  "Previous school's result card or leaving certificate, if any",
  "Parent or guardian's CNIC copy",
];

export default function AdmissionsPage() {
  return (
    <>
      <PageHero title="Admissions">{site.admissionsNote}. Apply online in a few minutes, or call the school office.</PageHero>

      <section className="wrap grid gap-10 py-16 md:grid-cols-[1fr_22rem] md:gap-14">
        <div>
          <h2 className="reveal font-display text-3xl font-semibold tracking-tight">Application form</h2>
          <div className="reveal mt-8">
            <PublicForm action={submitApplication} submitLabel="Submit application">
              <fieldset className="space-y-5">
                <legend className="font-display text-xl font-semibold">The child</legend>
                <PField label="Child's full name" name="childName" required autoComplete="off" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <PField label="Date of birth" name="dateOfBirth" type="date" required />
                  <PSelect label="Girl or boy" name="gender" required options={["Girl", "Boy"]} />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <PSelect label="Class applying for" name="classApplied" required options={CLASS_OPTIONS} />
                  <PField label="Previous school (if any)" name="previousSchool" />
                </div>
              </fieldset>
              <fieldset className="space-y-5 pt-3">
                <legend className="font-display text-xl font-semibold">Parent or guardian</legend>
                <PField label="Full name" name="guardianName" required autoComplete="name" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <PField label="Phone number" name="phone" type="tel" required autoComplete="tel" hint="We will call this number." />
                  <PField label="Email (optional)" name="email" type="email" autoComplete="email" />
                </div>
                <PField label="Home address (optional)" name="address" autoComplete="street-address" />
                <PTextarea label="Anything else we should know (optional)" name="notes" rows={3} />
              </fieldset>
            </PublicForm>
          </div>
        </div>

        <aside className="space-y-10">
          <div className="reveal">
            <h2 className="font-display text-2xl font-semibold">What happens next</h2>
            <ol className="mt-4 divide-y divide-paper-rule border-y border-paper-rule">
              {steps.map((s, i) => (
                <li key={s} className="grid grid-cols-[2.2rem_1fr] items-baseline gap-3 py-3">
                  <span className="font-display text-2xl font-semibold text-pen">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="reveal">
            <h2 className="font-display text-2xl font-semibold">Bring to the visit</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 marker:text-saffron">
              {documents.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <div className="reveal rounded-sm bg-board p-6 text-chalk">
            <p className="font-display text-xl font-semibold">Prefer to talk?</p>
            <p className="mt-2 text-chalk/80">Call or message the school office.</p>
            <a href={site.phoneHref} className="mt-3 block text-2xl font-semibold hover:underline">
              {site.phone}
            </a>
            <a href={site.whatsappHref} className="link-grow mt-2 inline-block text-chalk/90 hover:text-white">
              Message on WhatsApp
            </a>
          </div>
        </aside>
      </section>
    </>
  );
}
