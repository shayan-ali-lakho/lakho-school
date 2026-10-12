import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";

export const metadata: Metadata = { title: "Dashboard" };

// What each role will see as modules are added in later phases.
const roleModules: Record<AppRole, string[]> = {
  ADMIN: ["User management", "Classes and subjects", "Announcements", "System settings"],
  PRINCIPAL: ["School overview", "Staff and students", "Announcements", "Reports"],
  TEACHER: ["My classes", "Attendance", "Marks entry", "Announcements"],
  ACCOUNTANT: ["Fee structures", "Invoices and payments", "Defaulter reports"],
  STUDENT: ["My timetable", "My results", "My attendance", "Notices"],
  PARENT: ["My children", "Results and attendance", "Fee status", "Notices"],
};

export default async function PortalHome() {
  const user = await requireUser();

  const seesEverything = user.role === "ADMIN" || user.role === "PRINCIPAL";
  const announcements = await db.announcement.findMany({
    where: seesEverything ? {} : { audience: { has: user.role } },
    orderBy: { publishedAt: "desc" },
    take: 10,
    select: { id: true, title: true, body: true, publishedAt: true },
  });

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user.name}</h1>
        <p className="mt-1 text-zinc-600">Signed in as {ROLE_LABELS[user.role]}.</p>
      </section>

      <section>
        <h2 className="text-lg font-medium">Coming to your dashboard</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {roleModules[user.role].map((m) => (
            <li key={m} className="rounded-lg border border-dashed border-zinc-300 bg-white p-4 text-zinc-700">
              {m}
              <span className="ml-2 text-xs text-zinc-400">planned</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium">Announcements</h2>
        {announcements.length === 0 ? (
          <p className="mt-3 text-zinc-500">No announcements yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                <h3 className="font-medium">{a.title}</h3>
                <p className="mt-1 text-sm text-zinc-600">{a.body}</p>
                <p className="mt-2 text-xs text-zinc-400">
                  {a.publishedAt.toLocaleDateString("en-GB", { dateStyle: "medium" })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
