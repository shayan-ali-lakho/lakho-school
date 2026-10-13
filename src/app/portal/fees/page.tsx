import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import {
  FEE_TYPES,
  FEE_TYPE_LABELS,
  FINANCE_ROLES,
  currentMonth,
  feeStatus,
  monthLabel,
  parseFeeType,
  pkr,
} from "@/lib/finance";
import { ConfirmButton } from "@/components/confirm-button";
import { ReceiveFee } from "@/components/portal/receive-fee";
import { btnDanger, btnPrimary, btnSecondary, btnSm } from "@/components/ui";
import { deleteFee, generateInvoices } from "./actions";

export const metadata: Metadata = { title: "View fees" };

const STATUSES = ["Paid", "Partly paid", "Unpaid"] as const;
const field = "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm";

export default async function ViewFeesPage(props: PageProps<"/portal/fees">) {
  const user = await requireRole(FINANCE_ROLES);
  const canDelete = USER_ADMIN_ROLES.includes(user.role);
  const sp = await props.searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");

  // month: absent = this month, empty = all months
  const monthParam = sp.month === undefined ? currentMonth() : one("month");
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam) ? monthParam : "";
  const type = parseFeeType(one("type"));
  const classId = one("classId");
  const studentId = one("studentId");
  const status = (STATUSES as readonly string[]).includes(one("status")) ? one("status") : "";

  const [classes, students, invoices] = await Promise.all([
    db.class.findMany({
      orderBy: [{ academicYear: "desc" }, { name: "asc" }, { section: "asc" }],
      select: { id: true, name: true, section: true, academicYear: true },
    }),
    db.student.findMany({
      where: { user: { isActive: true }, ...(classId ? { classId } : {}) },
      orderBy: [{ class: { name: "asc" } }, { rollNumber: "asc" }],
      select: { id: true, rollNumber: true, user: { select: { name: true } } },
    }),
    db.feeInvoice.findMany({
      where: {
        ...(month ? { month } : {}),
        ...(type ? { type } : {}),
        student: { ...(classId ? { classId } : {}), ...(studentId ? { id: studentId } : {}) },
      },
      orderBy: [{ month: "desc" }, { student: { class: { name: "asc" } } }, { student: { rollNumber: "asc" } }],
      take: 500,
      select: {
        id: true,
        month: true,
        type: true,
        amount: true,
        student: {
          select: { id: true, rollNumber: true, user: { select: { name: true } }, class: { select: { name: true, section: true } } },
        },
        payments: { select: { id: true, amount: true, receiptNo: true } },
      },
    }),
  ]);

  const rows = invoices
    .map((i) => {
      const paid = i.payments.reduce((s, p) => s + p.amount, 0);
      return { ...i, paid, balance: i.amount - paid, status: feeStatus(i.amount, paid) };
    })
    .filter((r) => !status || r.status === status);

  const billed = rows.reduce((s, r) => s + r.amount, 0);
  const collected = rows.reduce((s, r) => s + r.paid, 0);
  const paidCount = rows.filter((r) => r.status === "Paid").length;
  const dueCount = rows.length - paidCount;

  // The address of this exact view, so actions return here with the filters intact.
  const qs = new URLSearchParams();
  qs.set("month", month);
  if (type) qs.set("type", type);
  if (classId) qs.set("classId", classId);
  if (studentId) qs.set("studentId", studentId);
  if (status) qs.set("status", status);
  const back = `/portal/fees?${qs.toString()}`;

  const stat = "rounded-lg border border-zinc-200 bg-white p-4";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">View fees</h1>
          <p className="mt-1 text-zinc-600">Who has paid and who still owes, by month, fee type, class and student.</p>
        </div>
        <Link href="/portal/fees/add" className={btnPrimary}>
          + Add fees
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <div>
          <label htmlFor="month" className="block text-xs font-medium text-zinc-500">Month</label>
          <input id="month" name="month" type="month" defaultValue={month} className={field} />
        </div>
        <div>
          <label htmlFor="type" className="block text-xs font-medium text-zinc-500">Fee type</label>
          <select id="type" name="type" defaultValue={type ?? ""} className={field}>
            <option value="">All types</option>
            {FEE_TYPES.map((t) => (
              <option key={t} value={t}>{FEE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="classId" className="block text-xs font-medium text-zinc-500">Class</label>
          <select id="classId" name="classId" defaultValue={classId} className={field}>
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.section} ({c.academicYear})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="studentId" className="block text-xs font-medium text-zinc-500">Student</label>
          <select id="studentId" name="studentId" defaultValue={studentId} className={field}>
            <option value="">All students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.user.name} (Roll {s.rollNumber})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-xs font-medium text-zinc-500">Status</label>
          <select id="status" name="status" defaultValue={status} className={field}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <button type="submit" className={btnPrimary}>Filter</button>
        <Link href="/portal/fees" className={btnSecondary}>Reset</Link>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={stat}>
          <p className="text-sm text-zinc-500">Total fees</p>
          <p className="mt-1 text-xl font-semibold">{pkr(billed)}</p>
        </div>
        <div className={stat}>
          <p className="text-sm text-zinc-500">Received</p>
          <p className="mt-1 text-xl font-semibold text-emerald-700">{pkr(collected)}</p>
        </div>
        <div className={stat}>
          <p className="text-sm text-zinc-500">Remaining</p>
          <p className="mt-1 text-xl font-semibold text-red-700">{pkr(billed - collected)}</p>
        </div>
        <div className={stat}>
          <p className="text-sm text-zinc-500">Paid / not fully paid</p>
          <p className="mt-1 text-xl font-semibold">{paidCount} / {dueCount}</p>
        </div>
      </div>

      {month && (
        <form action={generateInvoices} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="back" value={back} />
          <button type="submit" className={btnSecondary}>
            Create {monthLabel(month)} monthly fees for all students
          </button>
          <span className="text-sm text-zinc-500">Uses each student&apos;s monthly fee (or their class fee). Skips students who already have one.</span>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">Fee type</th>
              <th className="px-4 py-3 font-medium">Month</th>
              <th className="px-4 py-3 text-right font-medium">Fee</th>
              <th className="px-4 py-3 text-right font-medium">Paid</th>
              <th className="px-4 py-3 text-right font-medium">Remaining</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                  No fees match these filters.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-100 align-middle last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/portal/students/${r.student.id}`} className="text-emerald-700 hover:underline">
                    {r.student.user.name}
                  </Link>
                  <div className="text-xs text-zinc-500">Roll {r.student.rollNumber}</div>
                </td>
                <td className="px-4 py-3">{r.student.class ? `${r.student.class.name} ${r.student.class.section}` : "-"}</td>
                <td className="px-4 py-3">{FEE_TYPE_LABELS[r.type]}</td>
                <td className="px-4 py-3 whitespace-nowrap">{monthLabel(r.month)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.amount.toLocaleString("en-PK")}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {r.paid.toLocaleString("en-PK")}
                  {r.payments.length > 0 && (
                    <div className="text-xs">
                      {r.payments.map((p) => (
                        <Link key={p.id} href={`/portal/fees/receipt/${p.id}`} className="mr-1 text-emerald-700 hover:underline">
                          #{p.receiptNo}
                        </Link>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{r.balance.toLocaleString("en-PK")}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      r.status === "Paid"
                        ? "bg-emerald-50 text-emerald-800"
                        : r.status === "Partly paid"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {r.balance > 0 && (
                      <ReceiveFee invoiceId={r.id} balance={r.balance} studentName={r.student.user.name} back={back} />
                    )}
                    {canDelete && (
                      <form action={deleteFee}>
                        <input type="hidden" name="invoiceId" value={r.id} />
                        <input type="hidden" name="back" value={back} />
                        <ConfirmButton
                          label="Delete"
                          title="Delete this fee?"
                          message={`${FEE_TYPE_LABELS[r.type]} for ${r.student.user.name} (${monthLabel(r.month)}) and any payments recorded against it will be removed. This cannot be undone.`}
                          className={`${btnDanger} ${btnSm}`}
                        />
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length >= 500 && <p className="text-xs text-zinc-500">Showing the first 500 matches. Narrow the filters to see others.</p>}
    </div>
  );
}
