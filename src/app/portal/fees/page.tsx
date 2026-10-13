import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { FINANCE_ROLES, PAYMENT_METHODS, feeStatus, monthLabel, parseMonth, pkr } from "@/lib/finance";
import { MonthNav } from "@/components/portal/month-nav";
import { generateInvoices, recordPayment } from "./actions";

export const metadata: Metadata = { title: "Student fees" };

export default async function FeesPage(props: PageProps<"/portal/fees">) {
  await requireRole(FINANCE_ROLES);
  const sp = await props.searchParams;
  const month = parseMonth(sp.month);
  const filter = sp.filter === "unpaid" ? "unpaid" : "all";
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const invoices = await db.feeInvoice.findMany({
    where: { month },
    orderBy: [{ student: { class: { name: "asc" } } }, { student: { rollNumber: "asc" } }],
    select: {
      id: true,
      amount: true,
      student: {
        select: { id: true, rollNumber: true, user: { select: { name: true } }, class: { select: { name: true, section: true } } },
      },
      payments: { select: { id: true, amount: true, receiptNo: true } },
    },
  });

  const rows = invoices.map((i) => {
    const paid = i.payments.reduce((s, p) => s + p.amount, 0);
    return { ...i, paid, balance: i.amount - paid, status: feeStatus(i.amount, paid) };
  });
  const shown = filter === "unpaid" ? rows.filter((r) => r.balance > 0) : rows;

  const billed = rows.reduce((s, r) => s + r.amount, 0);
  const collected = rows.reduce((s, r) => s + r.paid, 0);
  const unpaidCount = rows.filter((r) => r.balance > 0).length;

  const stat = "rounded-lg border border-zinc-200 bg-white p-4";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Student fees</h1>
          <p className="mt-1 text-zinc-600">Monthly invoices and payments received at the office.</p>
        </div>
        <MonthNav basePath="/portal/fees" month={month} extra={filter === "unpaid" ? "&filter=unpaid" : ""} />
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <div className={stat}>
          <p className="text-sm text-zinc-500">Billed</p>
          <p className="mt-1 text-xl font-semibold">{pkr(billed)}</p>
        </div>
        <div className={stat}>
          <p className="text-sm text-zinc-500">Collected</p>
          <p className="mt-1 text-xl font-semibold text-emerald-700">{pkr(collected)}</p>
        </div>
        <div className={stat}>
          <p className="text-sm text-zinc-500">Outstanding</p>
          <p className="mt-1 text-xl font-semibold text-red-700">{pkr(billed - collected)}</p>
        </div>
        <div className={stat}>
          <p className="text-sm text-zinc-500">Students not fully paid</p>
          <p className="mt-1 text-xl font-semibold">{unpaidCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 text-sm">
          <Link
            href={`/portal/fees?month=${month}`}
            className={`rounded-md border px-3 py-1.5 ${filter === "all" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-zinc-300 bg-white"}`}
          >
            All
          </Link>
          <Link
            href={`/portal/fees?month=${month}&filter=unpaid`}
            className={`rounded-md border px-3 py-1.5 ${filter === "unpaid" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-zinc-300 bg-white"}`}
          >
            Not fully paid
          </Link>
        </div>
        <form action={generateInvoices}>
          <input type="hidden" name="month" value={month} />
          <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            Create {monthLabel(month)} invoices
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 text-right font-medium">Due</th>
              <th className="px-4 py-3 text-right font-medium">Paid</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Record payment</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
                  {rows.length === 0
                    ? `No invoices for ${monthLabel(month)} yet. Set each class's fee under "Class fees", then create the invoices.`
                    : "Everyone has paid."}
                </td>
              </tr>
            )}
            {shown.map((r) => (
              <tr key={r.id} className="border-b border-zinc-100 align-top last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/portal/students/${r.student.id}`} className="text-emerald-700 hover:underline">
                    {r.student.user.name}
                  </Link>
                  <div className="text-xs text-zinc-500">Roll {r.student.rollNumber}</div>
                </td>
                <td className="px-4 py-3">{r.student.class ? `${r.student.class.name} ${r.student.class.section}` : "-"}</td>
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
                    className={
                      r.status === "Paid" ? "text-emerald-700" : r.status === "Partly paid" ? "text-amber-700" : "text-red-700"
                    }
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.balance > 0 ? (
                    <form action={recordPayment} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="invoiceId" value={r.id} />
                      <input type="hidden" name="month" value={month} />
                      <input
                        name="amount"
                        type="number"
                        min={1}
                        max={r.balance}
                        defaultValue={r.balance}
                        aria-label={`Amount for ${r.student.user.name}`}
                        className="w-24 rounded-md border border-zinc-300 px-2 py-1"
                      />
                      <select
                        name="method"
                        aria-label="Payment method"
                        className="rounded-md border border-zinc-300 bg-white px-2 py-1"
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                      <button type="submit" className="rounded-md bg-emerald-700 px-3 py-1 text-white hover:bg-emerald-800">
                        Receive
                      </button>
                    </form>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
