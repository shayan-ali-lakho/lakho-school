import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { PField, PTextarea, PublicForm } from "@/components/site/public-form";
import { site } from "@/lib/site";
import { sendMessage } from "./actions";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${site.name} by phone, WhatsApp, email or the message form.`,
};

export default function ContactPage() {
  const rows: [string, React.ReactNode][] = [
    ["Phone", <a key="p" href={site.phoneHref} className="link-grow hover:text-pen">{site.phone}</a>],
    ["WhatsApp", <a key="w" href={site.whatsappHref} className="link-grow hover:text-pen">Send a message</a>],
    ["Email", <a key="e" href={`mailto:${site.email}`} className="link-grow hover:text-pen">{site.email}</a>],
    ["School time", site.hours],
  ];
  if (site.address) rows.unshift(["Address", site.address]);

  return (
    <>
      <PageHero title="Contact us">Questions about admissions, fees or the school? Call, message or write to us.</PageHero>
      <section className="wrap grid gap-12 py-16 md:grid-cols-2 md:gap-16">
        <div>
          <h2 className="reveal font-display text-3xl font-semibold tracking-tight">Get in touch</h2>
          <dl className="mt-6 divide-y divide-paper-rule border-y border-paper-rule">
            {rows.map(([label, value], i) => (
              <div
                key={label}
                style={{ "--i": i } as React.CSSProperties}
                className="reveal-row grid gap-1 py-4 sm:grid-cols-[8rem_1fr] sm:gap-6"
              >
                <dt className="text-ink-soft">{label}</dt>
                <dd className="text-lg">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="reveal font-display text-3xl font-semibold tracking-tight">Send a message</h2>
          <div className="reveal mt-6">
            <PublicForm action={sendMessage} submitLabel="Send message">
              <PField label="Your name" name="name" required autoComplete="name" />
              <div className="grid gap-5 sm:grid-cols-2">
                <PField label="Phone" name="phone" type="tel" autoComplete="tel" />
                <PField label="Email" name="email" type="email" autoComplete="email" />
              </div>
              <PTextarea label="Message" name="message" required />
              <p className="text-sm text-ink-soft">Give a phone number or an email so we can reply.</p>
            </PublicForm>
          </div>
        </div>
      </section>
    </>
  );
}
