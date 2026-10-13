import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { navFor } from "@/lib/portal-nav";
import { ROLE_LABELS } from "@/lib/roles";
import { currentMonth, dateOnly, monthLabel, pkr, todayKarachi } from "@/lib/finance";
import { teacherIdFor } from "@/lib/class-access";

export const metadata: Metadata = { title: "Dashboard" };

type Stat = { label: string; value: string; href?: string; tone?: "good" | "bad" };

export default async function PortalHome() {
  const user = await requireUser();
  const seesEverything = user.role === "ADMIN" || user.role === "PRINCIPAL";
  const month = currentMonth();
  const stats: Stat[] = [];

  if (seesEverything || user.role === "ACCOUNTANT") {
    const invoices = await db.feeInvoice.findMany({
      where: { month },
      select: { amount: true, payments: { select: { amount: true } } },
    });
    const billed = invoices.reduce((s, i) => s + i.amount, 0);
    const paid = invoices.reduce((s, i) => s + i.payments.reduce((a, p) => a + p.amount, 0), 0);
    stats.push(
      { label: `Fees collected, ${monthLabel(month)}`, value: pkr(paid), href: "/portal/fees", tone: "good" },
      { label: "Fees still due this month", value: pkr(billed - paid), href: "/portal/fees?filter=unpaid", tone: billed - paid > 0 ? "bad" : undefined },
    );
  }

  if (seesEverything) {
    const today = new Date(`${todayKarachi()}T00:00:00.000Z`);
    const [students, teachers, newApps, newMsgs, present, marked] = await Promise.all([
      db.student.count({ where: { user: { isActive: true } } }),
      db.teacher.count({ where: { user: { isActive: true } } }),
      db.admissionApplication.count({ where: { status: "NEW" } }),
      db.contactMessage.count({ where: { handled: false } }),
      db.attendance.count({ where: { date: today, status: { in: ["PRESENT", "LATE"] } } }),
      db.attendance.count({ where: { date: today } }),
    ]);
    stats.unshift(
      { label: "Students", value: String(students), href: "/portal/students" },
      { label: "Teachers", value: String(teachers), href: "/portal/teachers" },
    );
    stats.push(
      { label: "Present today", value: marked ? `${present} of ${marked}` : "Not marked yet", href: "/portal/attendance" },
      { label: "New website inquiries", value: String(newApps + newMsgs), href: "/portal/inquiries", tone: newApps + newMsgs > 0 ? "bad" : undefined },
    );
  }

  if (user.role === "TEACHER") {
    const tid = await teacherIdFor(user.id);
    const [courses, led] = tid
      ? await Promise.all([db.course.count({ where: { teacherId: tid } }), db.class.count({ where: { classTeacherId: tid } })])
      : [0, 0];
    stats.push(
      { label: "Subjects I teach", value: String(courses), href: "/portal/courses" },
      { label: "Classes I lead", value: String(led), href: "/portal/attendance" },
    );
  }

  const announcements = await db.announcement.findMany({
    where: seesEverything ? {} : { audience: { has: user.role } },
    orderBy: { publishedAt: "desc" },
    take: 8,
    select: { id: true, title: true, body: true, publishedAt: true },
  });

  const links = navFor(user.role).flatMap((g) => g.items).filter((i) => i.href !== "/portal");

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user.name}</h1>
        <p className="mt-1 text-zinc-600">Signed in as {ROLE_LABELS[user.role]}.</p>
      </section>

      {stats.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => {
            const body = (
              <>
                <p className="text-sm text-zinc-500">{s.label}</p>
                <p className={`mt-1 text-xl font-semibold ${s.tone === "good" ? "text-emerald-700" : s.tone === "bad" ? "text-red-700" : ""}`}>{s.value}</p>
              </>
            );
            return s.href ? (
              <Link key={s.label} href={s.href} className="rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-emerald-400">{body}</Link>
            ) : (
              <div key={s.label} className="rounded-lg border border-zinc-200 bg-white p-4">{body}</div>
            );
          })}
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium">Quick links</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium transition-colors hover:border-emerald-400 hover:text-emerald-800">
                {l.label}
              </Link>
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
                <p className="mt-1 whitespace-pre-line text-sm text-zinc-600">{a.body}</p>
                <p className="mt-2 text-xs text-zinc-400">{dateOnly(a.publishedAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
