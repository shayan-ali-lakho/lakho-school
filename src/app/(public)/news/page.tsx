import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { db } from "@/lib/db";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "News and notices",
  description: `Public notices from ${site.name}.`,
};

// Refresh every five minutes.
export const revalidate = 300;

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default async function NewsPage() {
  let notices: { id: string; title: string; body: string; publishedAt: Date }[] = [];
  try {
    notices = await db.announcement.findMany({
      where: { isPublic: true },
      orderBy: { publishedAt: "desc" },
      take: 30,
      select: { id: true, title: true, body: true, publishedAt: true },
    });
  } catch (error) {
    console.error("Could not load public notices:", error);
  }

  return (
    <>
      <PageHero title="News and notices">Announcements from the school office.</PageHero>
      <section className="wrap py-16">
        {notices.length === 0 ? (
          <p className="text-lg text-ink-soft">There are no public notices at the moment. Please check again soon.</p>
        ) : (
          <ul className="max-w-3xl space-y-5">
            {notices.map((n, i) => (
              <li
                key={n.id}
                style={{ "--i": Math.min(i, 4) } as React.CSSProperties}
                className="reveal lift rounded-sm border border-paper-rule bg-white p-6"
              >
                <p className="text-sm text-ink-soft">{dateFormat.format(n.publishedAt)}</p>
                <h2 className="mt-1 font-display text-2xl font-semibold">{n.title}</h2>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-soft">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
