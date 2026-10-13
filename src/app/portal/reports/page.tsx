import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { PAYROLL_ROLES, feeStatus, monthLabel, monthRange, parseMonth, pkr, shiftMonth } from "@/lib/finance";
import { MonthNav } from "@/components/portal/month-nav";
import { PrintButton } from "@/components/portal/print-button";

export const metadata: Metadata = { title: "Monthly report" };

export default async function MonthlyReportPage(props: PageProps<"/portal/reports">) {
  await requireRole(PAYROLL_ROLES);
  const { month: monthParam } = await props.searchParams;
  const month = parseMonth(monthParam);
  const { start, end } = monthRange(month);

  const [invoices, payments, salaries, expenses] = await Promise.all([
    db.feeInvoice.findMany({
      where: { month },
      select: {
        amount: true,
        payments: { select: { amount: true } },
        student: { select: { id: true, user: { select: { name: true } }, class: { select: { name: true, section: true } } } },
      },
    }),
    db.feePayment.aggregate({ where: { paidOn: { gte: start, lt: end } }, _sum: { amount: true } }),
    db.salaryRecord.findMany({ where: { month }, select: { baseSalary: true, allowances: true, deductions: true, paidOn: true } }),
    db.expense.findMany({
      where: { date: { gte: new Date(`${month}-01T00:00:00.000Z`), lt: new Date(`${shiftMonth(month, 1)}-01T00:00:00.000Z`) } },
      select: { category: true, amount: true },
    }),
  ]);

  // Fees
  const billed = invoices.reduce((s, i) => s + i.amount, 0);
  const paidOnBills = invoices.reduce((s, i) => s + i.payments.reduce((a, p) => a + p.amount, 0), 0);
  const collected = payments._sum.amount ?? 0; // everything received in the month, even for older bills
  const defaulters = invoices
    .map((i) => {
      const paid = i.payments.reduce((a, p) => a + p.amount, 0);
      return { ...i, paid, balance: i.amount - paid, status: feeStatus(i.amount, paid) };
    })
    .filter((i) => i.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  // Salaries
  const net = (r: { baseSalary: number; allowances: number; deductions: number }) => r.baseSalary + r.allowances - r.deductions;
  const salaryTotal = salaries.reduce((s, r) => s + net(r), 0);
  const salaryPaid = salaries.filter((r) => r.paidOn).reduce((s, r) => s + net(r), 0);
  const deductionsTotal = salaries.reduce((s, r) => s + r.deductions, 0);

  // Expenses
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = new Map<string, number>();
  for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);

  const surplus = collected - salaryTotal - expenseTotal;
  const card = "rounded-lg border border-zinc-200 bg-white p-5 print:break-inside-avoid";
  const row = "flex justify-between gap-4 py-1.5 text-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monthly report: {monthLabel(month)}</h1>
          <p className="mt-1 text-zinc-600">Fees, teacher salaries and school expenses in one place.</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <MonthNav basePath="/portal/reports" month={month} />
          <PrintButton />
        </div>
      </div>

      <div className={`${card} ${surplus >= 0 ? "border-emerald-300" : "border-red-300"}`}>
        <p className="text-sm text-zinc-500">Left over this month (fees collected − salaries − expenses)</p>
        <p className={`mt-1 text-3xl font-semibold ${surplus >= 0 ? "text-emerald-700" : "text-red-700"}`}>
          {surplus < 0 ? "−" : ""}
          {pkr(Math.abs(surplus))}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={card}>
          <h2 className="font-medium">Student fees</h2>
          <dl className="mt-3 divide-y divide-zinc-100">
            <div className={row}><dt className="text-zinc-600">Billed for the month</dt><dd className="tabular-nums">{pkr(billed)}</dd></div>
            <div className={row}><dt className="text-zinc-600">Paid on these bills</dt><dd className="tabular-nums">{pkr(paidOnBills)}</dd></div>
            <div className={row}><dt className="text-zinc-600">Still outstanding</dt><dd className="tabular-nums text-red-700">{pkr(billed - paidOnBills)}</dd></div>
            <div className={`${row} font-medium`}><dt>Cash received in the month</dt><dd className="tabular-nums text-emerald-700">{pkr(collected)}</dd></div>
          </dl>
        </section>

        <section className={card}>
          <h2 className="font-medium">Teacher salaries</h2>
          <dl className="mt-3 divide-y divide-zinc-100">
            <div className={row}><dt className="text-zinc-600">Teachers on payroll</dt><dd>{salaries.length}</dd></div>
            <div className={row}><dt className="text-zinc-600">Deductions</dt><dd className="tabular-nums">{pkr(deductionsTotal)}</dd></div>
            <div className={row}><dt className="text-zinc-600">Paid out</dt><dd className="tabular-nums">{pkr(salaryPaid)}</dd></div>
            <div className={row}><dt className="text-zinc-600">Still to pay</dt><dd className="tabular-nums text-red-700">{pkr(salaryTotal - salaryPaid)}</dd></div>
            <div className={`${row} font-medium`}><dt>Total net salaries</dt><dd className="tabular-nums">{pkr(salaryTotal)}</dd></div>
          </dl>
        </section>

        <section className={card}>
          <h2 className="font-medium">School expenses</h2>
          <dl className="mt-3 divide-y divide-zinc-100">
            {[...byCategory.entries()].sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat} className={row}><dt className="text-zinc-600">{cat}</dt><dd className="tabular-nums">{pkr(amt)}</dd></div>
            ))}
            {byCategory.size === 0 && <p className="py-2 text-sm text-zinc-500">No expenses recorded.</p>}
            <div className={`${row} font-medium`}><dt>Total expenses</dt><dd className="tabular-nums">{pkr(expenseTotal)}</dd></div>
          </dl>
        </section>
      </div>

      <section className={card}>
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Fee defaulters ({defaulters.length})</h2>
          <Link href={`/portal/fees?month=${month}&filter=unpaid`} className="text-sm text-emerald-700 hover:underline print:hidden">
            Open in Student fees
          </Link>
        </div>
        {defaulters.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Everyone with an invoice this month has paid in full.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2 font-medium">Student</th>
                <th className="py-2 font-medium">Class</th>
                <th className="py-2 text-right font-medium">Due</th>
                <th className="py-2 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {defaulters.slice(0, 50).map((d) => (
                <tr key={d.student.id} className="border-t border-zinc-100">
                  <td className="py-2">{d.student.user.name}</td>
                  <td className="py-2">{d.student.class ? `${d.student.class.name} ${d.student.class.section}` : "-"}</td>
                  <td className="py-2 text-right tabular-nums">{d.amount.toLocaleString("en-PK")}</td>
                  <td className="py-2 text-right tabular-nums text-red-700">{d.balance.toLocaleString("en-PK")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
