import type { Metadata } from "next";
import { btnDanger, btnSm } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ROLE_LABELS, USER_ADMIN_ROLES, type AppRole } from "@/lib/roles";
import { dateTime } from "@/lib/finance";
import { ActionForm } from "@/components/action-form";
import { Card, Field } from "@/components/fields";
import { deleteAnnouncement, postAnnouncement } from "./actions";

export const metadata: Metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  const user = await requireRole(["ADMIN"]);
  const isManager = USER_ADMIN_ROLES.includes(user.role);

  const items = await db.announcement.findMany({
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: { id: true, title: true, body: true, audience: true, isPublic: true, publishedAt: true, authorId: true, author: { select: { name: true } } },
  });

  const audiences: AppRole[] = isManager ? ["STUDENT", "PARENT", "TEACHER", "ACCOUNTANT"] : ["STUDENT", "PARENT"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="mt-1 text-zinc-600">Notices appear on each person&apos;s dashboard. Public ones also show on the school website.</p>
      </div>

      <Card title="New announcement">
        <ActionForm action={postAnnouncement} submitLabel="Post announcement">
          <Field label="Title" name="title" required />
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-zinc-700">Message <span className="text-red-600"> *</span></label>
            <textarea id="body" name="body" required rows={4} className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" />
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-zinc-700">Who should see it</legend>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {audiences.map((a) => (
                <label key={a} className="flex items-center gap-1.5">
                  <input type="checkbox" name="audience" value={a} /> {ROLE_LABELS[a]}s
                </label>
              ))}
              {isManager && (
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" name="isPublic" /> Public (website)
                </label>
              )}
            </div>
          </fieldset>
        </ActionForm>
      </Card>

      <section>
        <h2 className="text-lg font-medium">Recent announcements</h2>
        <ul className="mt-3 space-y-3">
          {items.length === 0 && <li className="text-zinc-500">Nothing posted yet.</li>}
          {items.map((a) => (
            <li key={a.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{a.title}</h3>
                  <p className="text-xs text-zinc-500">
                    {dateTime(a.publishedAt)} · {a.author.name} · to{" "}
                    {[...a.audience.map((r) => `${ROLE_LABELS[r as AppRole]}s`), ...(a.isPublic ? ["public website"] : [])].join(", ") || "nobody"}
                  </p>
                </div>
                {(isManager || a.authorId === user.id) && (
                  <form action={deleteAnnouncement}>
                    <input type="hidden" name="id" value={a.id} />
                    <ConfirmButton label="Delete" title="Delete this announcement?" message="It will disappear for everyone, including the website news page." className={`${btnDanger} ${btnSm}`} />
                  </form>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">{a.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
