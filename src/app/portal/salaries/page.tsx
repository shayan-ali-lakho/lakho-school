import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { PAYROLL_ROLES, dateOnly, monthLabel, parseMonth, pkr } from "@/lib/finance";
import { MonthNav } from "@/components/portal/month-nav";
import { generateSalaries, saveSalary, setSalaryPaid } from "./actions";

export const metadata: Metadata = { title: "Teacher salaries" };

const input = "w-24 rounded-md border border-zinc-300 px-2 py-1 text-right";

export default async function SalariesPage(props: PageProps<"/portal/salaries">) {
  await requireRole(PAYROLL_ROLES);
  const sp = await props.searchParams;
  const month = parseMonth(sp.month);

  const records = await db.salaryRecord.findMany({
    where: { month },
    orderBy: { teacher: { user: { name: "asc" } } },
    select: {
      id: true,
      baseSalary: true,
      daysOff: true,
      deductions: true,
      note: true,
      paidOn: true,
      teacher: { select: { position: true, user: { select: { name: true } } } },
    },
  });

  const net = (r: { baseSalary: number; deductions: number }) => r.baseSalary - r.deductions;
  const total = records.reduce((s, r) => s + net(r), 0);
  const paid = records.filter((r) => r.paidOn).reduce((s, r) => s + net(r), 0);
  const stat = "rounded-lg border border-zinc-200 bg-white p-4";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teacher salaries</h1>
          <p className="mt-1 text-zinc-600">
            Net salary = base salary − (base ÷ 30 × days off). Base salary for each teacher is set on the Teachers page.
          </p>
        </div>
        <MonthNav basePath="/portal/salaries" month={month} />
      </div>


      <div className="grid gap-4 sm:grid-cols-3">
        <div className={stat}>
          <p className="text-sm text-zinc-500">Total net salaries</p>
          <p className="mt-1 text-xl font-semibold">{pkr(total)}</p>
        </div>
        <div className={stat}>
          <p className="text-sm text-zinc-500">Paid</p>
          <p className="mt-1 text-xl font-semibold text-emerald-700">{pkr(paid)}</p>
        </div>
        <div className={stat}>
          <p className="text-sm text-zinc-500">Still to pay</p>
          <p className="mt-1 text-xl font-semibold text-red-700">{pkr(total - paid)}</p>
        </div>
      </div>

      <form action={generateSalaries}>
        <input type="hidden" name="month" value={month} />
        <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          Create {monthLabel(month)} salary lines
        </button>
        <span className="ml-3 text-sm text-zinc-500">Adds any teacher who does not have a line yet.</span>
      </form>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Teacher</th>
              <th className="px-4 py-3 font-medium">Base</th>
              <th className="px-4 py-3 font-medium">Days off</th>
              <th className="px-4 py-3 text-right font-medium">Deducted</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 text-right font-medium">Net (PKR)</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
                  No salary lines for {monthLabel(month)} yet.
                </td>
              </tr>
            )}
            {records.map((r) => {
              const formId = `sal-${r.id}`;
              const locked = Boolean(r.paidOn);
              return (
                <tr key={r.id} className="border-b border-zinc-100 align-top last:border-0">
                  <td className="px-4 py-3">
                    <div>{r.teacher.user.name}</div>
                    {r.teacher.position && <div className="text-xs text-zinc-500">{r.teacher.position}</div>}
                  </td>
                  {/* The inputs live in this row but belong to one form via the form attribute. */}
                  <td className="px-4 py-3">
                    <input form={formId} name="baseSalary" type="number" min={0} defaultValue={r.baseSalary} disabled={locked} aria-label="Base salary" className={input} />
                  </td>
                  <td className="px-4 py-3">
                    <input form={formId} name="daysOff" type="number" min={0} max={30} defaultValue={r.daysOff} disabled={locked} aria-label="Days off" className={input} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-600">{r.deductions.toLocaleString("en-PK")}</td>
                  <td className="px-4 py-3">
                    <input form={formId} name="note" defaultValue={r.note ?? ""} disabled={locked} aria-label="Note" placeholder="Optional note" className="w-40 rounded-md border border-zinc-300 px-2 py-1" />
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{net(r).toLocaleString("en-PK")}</td>
                  <td className="px-4 py-3">
                    <form id={formId} action={saveSalary} className="mb-2">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="month" value={month} />
                      {!locked && (
                        <button type="submit" className="text-emerald-700 hover:underline">
                          Save
                        </button>
                      )}
                    </form>
                    <form action={setSalaryPaid}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="month" value={month} />
                      <input type="hidden" name="paid" value={String(!locked)} />
                      <button type="submit" className={locked ? "text-zinc-600 hover:underline" : "text-emerald-700 hover:underline"}>
                        {locked ? `Paid ${dateOnly(r.paidOn!)} · mark unpaid` : "Mark paid"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
