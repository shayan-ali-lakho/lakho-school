import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { navFor } from "@/lib/portal-nav";
import { ROLE_LABELS } from "@/lib/roles";
import { currentMonth, dateOnly, monthLabel, pkr, shiftMonth, todayKarachi } from "@/lib/finance";
import { teacherIdFor } from "@/lib/class-access";
import { BarChart, Donut, HBars, Icon, Panel, StatCard, WeekBars, iconForHref, type Segment } from "@/components/portal/dash";

export const metadata: Metadata = { title: "Dashboard" };

const shortMonth = (m: string) =>
  new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Karachi" }).format(new Date())) % 24;
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function PortalHome() {
  const user = await requireUser();
  const seesEverything = user.role === "ADMIN" || user.role === "PRINCIPAL";
  const seesMoney = seesEverything || user.role === "ACCOUNTANT";
  const month = currentMonth();
  const todayStr = todayKarachi();
  const today = new Date(`${todayStr}T00:00:00.000Z`);

  /* ----- fees (admin, principal, accountant) ----- */
  let feeCards: { collected: number; due: number; billed: number; expenses: number } | null = null;
  let feeTrend: { label: string; a: number; b: number }[] = [];
  let feeStatus: Segment[] = [];

  if (seesMoney) {
    const months = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5));
    const [invoices, expenseRows] = await Promise.all([
      db.feeInvoice.findMany({
        where: { month: { in: months } },
        select: { month: true, amount: true, payments: { select: { amount: true } } },
      }),
      db.expense.aggregate({
        where: { date: { gte: new Date(`${month}-01T00:00:00Z`), lt: new Date(`${shiftMonth(month, 1)}-01T00:00:00Z`) } },
        _sum: { amount: true },
      }),
    ]);
    const byMonth = new Map(months.map((m) => [m, { billed: 0, paid: 0 }]));
    let paidN = 0, partialN = 0, unpaidN = 0;
    for (const inv of invoices) {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      const row = byMonth.get(inv.month)!;
      row.billed += inv.amount;
      row.paid += paid;
      if (inv.month === month) {
        if (paid >= inv.amount) paidN++;
        else if (paid > 0) partialN++;
        else unpaidN++;
      }
    }
    const cur = byMonth.get(month)!;
    feeCards = { collected: cur.paid, due: Math.max(cur.billed - cur.paid, 0), billed: cur.billed, expenses: expenseRows._sum.amount ?? 0 };
    feeTrend = months.map((m) => ({ label: shortMonth(m), a: byMonth.get(m)!.billed, b: byMonth.get(m)!.paid }));
    feeStatus = [
      { label: "Paid", value: paidN, color: "#059669" },
      { label: "Partial", value: partialN, color: "#f59e0b" },
      { label: "Unpaid", value: unpaidN, color: "#dc2626" },
    ];
  }

  /* ----- people, attendance, inquiries (admin, principal) ----- */
  let people: { students: number; teachers: number; classes: number; inquiries: number } | null = null;
  let attendanceToday: Segment[] = [];
  let attendanceMarked = 0;
  let attendancePresent = 0;
  let week: { label: string; pct: number | null }[] = [];
  let perClass: { label: string; value: number }[] = [];

  if (seesEverything) {
    const from = new Date(today);
    from.setUTCDate(from.getUTCDate() - 6);
    const [students, teachers, newApps, newMsgs, weekRows, classes] = await Promise.all([
      db.student.count({ where: { user: { isActive: true } } }),
      db.teacher.count({ where: { user: { isActive: true } } }),
      db.admissionApplication.count({ where: { status: "NEW" } }),
      db.contactMessage.count({ where: { handled: false } }),
      db.attendance.findMany({ where: { date: { gte: from, lte: today } }, select: { date: true, status: true } }),
      db.class.findMany({
        select: { name: true, section: true, _count: { select: { students: { where: { user: { isActive: true } } } } } },
      }),
    ]);
    people = { students, teachers, classes: classes.length, inquiries: newApps + newMsgs };

    const counts = { PRESENT: 0, LATE: 0, ABSENT: 0, LEAVE: 0 };
    week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(from);
      d.setUTCDate(from.getUTCDate() + i);
      const rows = weekRows.filter((r) => r.date.getTime() === d.getTime());
      if (d.getTime() === today.getTime()) for (const r of rows) counts[r.status]++;
      const here = rows.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
      return {
        label: new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(d),
        pct: rows.length ? Math.round((here / rows.length) * 100) : null,
      };
    });
    attendanceMarked = counts.PRESENT + counts.LATE + counts.ABSENT + counts.LEAVE;
    attendancePresent = counts.PRESENT + counts.LATE;
    attendanceToday = [
      { label: "Present", value: counts.PRESENT, color: "#059669" },
      { label: "Late", value: counts.LATE, color: "#f59e0b" },
      { label: "Absent", value: counts.ABSENT, color: "#dc2626" },
      { label: "Leave", value: counts.LEAVE, color: "#a1a1aa" },
    ];
    perClass = classes
      .map((c) => ({ label: `${c.name} ${c.section}`, value: c._count.students }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }

  /* ----- teacher ----- */
  let mine: { subjects: number; led: number } | null = null;
  if (user.role === "TEACHER") {
    const tid = await teacherIdFor(user.id);
    const [subjects, led] = tid
      ? await Promise.all([db.course.count({ where: { teacherId: tid } }), db.class.count({ where: { classTeacherId: tid } })])
      : [0, 0];
    mine = { subjects, led };
  }

  const announcements = await db.announcement.findMany({
    where: seesEverything ? {} : { audience: { has: user.role } },
    orderBy: { publishedAt: "desc" },
    take: 5,
    select: { id: true, title: true, body: true, publishedAt: true },
  });

  const links = navFor(user.role).flatMap((g) => g.items).filter((i) => i.href !== "/portal");
  const dateLine = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" }).format(new Date());

  return (
    <div className="stagger space-y-8">
      {/* welcome banner */}
      <section className="relative overflow-hidden rounded-2xl bg-[#111111] p-6 text-white shadow-md sm:p-8">
        <p className="relative text-sm text-white/70">{dateLine}</p>
        <h1 className="relative mt-1 text-2xl font-semibold tracking-tight !text-white sm:text-3xl">
          {greeting()}, {user.name}
        </h1>
        <p className="relative mt-2 flex flex-wrap items-center gap-2 text-sm text-white/70">
          <span className="rounded-full bg-white/15 px-3 py-0.5 text-white">{ROLE_LABELS[user.role]}</span>
          <span>Dr. G.M. Lakho Memorial Sec. School</span>
        </p>
        <span className="absolute inset-x-0 bottom-0 h-1 bg-[#d9541e]" />
      </section>

      {/* count cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {people && (
          <>
            <StatCard label="Students" value={String(people.students)} sub={`in ${people.classes} ${people.classes === 1 ? "class" : "classes"}`} icon="cap" href="/portal/students" />
            <StatCard label="Teachers" value={String(people.teachers)} sub="active staff" icon="users" href="/portal/teachers" />
          </>
        )}
        {feeCards && (
          <>
            <StatCard label={`Collected, ${monthLabel(month)}`} value={pkr(feeCards.collected)} sub={`of ${pkr(feeCards.billed)} billed`} icon="wallet" href="/portal/fees" />
            <StatCard label="Still due this month" value={pkr(feeCards.due)} sub={feeCards.due > 0 ? "Tap to see who owes" : "All clear"} icon="alert" href="/portal/fees?status=Unpaid" />
            <StatCard label="Expenses this month" value={pkr(feeCards.expenses)} sub="rent, bills, supplies" icon="trend" href="/portal/expenses" />
          </>
        )}
        {people && (
          <>
            <StatCard
              label="Present today"
              value={attendanceMarked ? `${attendancePresent} of ${attendanceMarked}` : "Not marked"}
              sub={attendanceMarked ? `${Math.round((attendancePresent / attendanceMarked) * 100)}% attendance` : "Attendance not taken yet"}
              icon="check" href="/portal/attendance"
            />
            <StatCard label="New inquiries" value={String(people.inquiries)} sub="admissions and messages" icon="mail" href="/portal/inquiries" />
          </>
        )}
        {mine && (
          <>
            <StatCard label="Subjects I teach" value={String(mine.subjects)} icon="book" href="/portal/courses" />
            <StatCard label="Classes I lead" value={String(mine.led)} icon="building" href="/portal/attendance" />
          </>
        )}
      </section>

      {/* charts */}
      {feeCards && (
        <section className="grid gap-5 lg:grid-cols-3">
          <Panel title="Fees, last 6 months" hint="Billed vs collected" className="lg:col-span-2">
            <BarChart data={feeTrend} aLabel="Billed" bLabel="Collected" />
          </Panel>
          <Panel title={`Fee status, ${monthLabel(month)}`} hint="by student invoice">
            <Donut
              segments={feeStatus}
              centre={feeCards.billed ? `${Math.round((feeCards.collected / feeCards.billed) * 100)}%` : "0%"}
              sub="collected"
              empty="No fees yet"
            />
          </Panel>
        </section>
      )}

      {people && (
        <section className="grid gap-5 lg:grid-cols-3">
          <Panel title="Attendance this week" hint="% present each day" className="lg:col-span-2">
            <WeekBars days={week} />
          </Panel>
          <Panel title="Today" hint={dateOnly(today)}>
            <Donut segments={attendanceToday} centre={String(attendanceMarked)} sub="marked" empty="Not marked yet" />
          </Panel>
          <Panel title="Students per class" className="lg:col-span-3">
            <HBars rows={perClass} empty="Add classes to see how students are spread." />
          </Panel>
        </section>
      )}

      {/* quick links */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Quick links</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-800 hover:shadow-md">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
                  <Icon name={iconForHref(l.href)} className="size-[18px]" />
                </span>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* announcements */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Announcements</h2>
        {announcements.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">No announcements yet.</p>
        ) : (
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className="flex gap-4 rounded-xl border border-zinc-200 border-l-4 border-l-brand-700 bg-white p-4 shadow-sm">
                <span className="mt-0.5 hidden size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 sm:grid">
                  <Icon name="bell" className="size-[18px]" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-medium text-zinc-900">{a.title}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-zinc-600">{a.body}</p>
                  <p className="mt-2 text-xs text-zinc-400">{dateOnly(a.publishedAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
