import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { EXPENSE_CATEGORIES, FINANCE_ROLES, currentMonth, parseMonth, pkr, shiftMonth } from "@/lib/finance";
import { MonthNav } from "@/components/portal/month-nav";
import { addExpense, deleteExpense } from "./actions";

export const metadata: Metadata = { title: "School expenses" };

const field = "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2";

export default async function ExpensesPage(props: PageProps<"/portal/expenses">) {
  await requireRole(FINANCE_ROLES);
  const sp = await props.searchParams;
  const month = parseMonth(sp.month);
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const expenses = await db.expense.findMany({
    where: { date: { gte: new Date(`${month}-01T00:00:00.000Z`), lt: new Date(`${shiftMonth(month, 1)}-01T00:00:00.000Z`) } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: { id: true, date: true, category: true, description: true, amount: true, createdBy: { select: { name: true } } },
  });

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = new Map<string, number>();
  for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);

  const today = new Date().toISOString().slice(0, 10);
  const defaultDate = month === currentMonth() ? today : `${month}-01`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">School expenses</h1>
          <p className="mt-1 text-zinc-600">Rent, bills, supplies and other running costs. Salaries are tracked separately.</p>
        </div>
        <MonthNav basePath="/portal/expenses" month={month} />
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="font-medium">Add an expense</h2>
        <form action={addExpense} className="mt-3 grid gap-3 sm:grid-cols-[9rem_12rem_1fr_9rem_auto] sm:items-end">
          <input type="hidden" name="month" value={month} />
          <div>
            <label htmlFor="date" className="text-sm text-zinc-600">Date</label>
            <input id="date" name="date" type="date" required defaultValue={defaultDate} className={field} />
          </div>
          <div>
            <label htmlFor="category" className="text-sm text-zinc-600">Category</label>
            <select id="category" name="category" required defaultValue="" className={field}>
              <option value="" disabled>Choose...</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="description" className="text-sm text-zinc-600">What was it for</label>
            <input id="description" name="description" required maxLength={200} className={field} />
          </div>
          <div>
            <label htmlFor="amount" className="text-sm text-zinc-600">Amount (PKR)</label>
            <input id="amount" name="amount" type="number" min={1} required className={field} />
          </div>
          <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800">
            Add
          </button>
        </form>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                    No expenses recorded this month.
                  </td>
                </tr>
              )}
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-zinc-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">
                    {e.date.toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" })}
                  </td>
                  <td className="px-4 py-3">{e.category}</td>
                  <td className="px-4 py-3">
                    {e.description}
                    {e.createdBy && <div className="text-xs text-zinc-500">Added by {e.createdBy.name}</div>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{e.amount.toLocaleString("en-PK")}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="month" value={month} />
                      <button type="submit" className="text-red-700 hover:underline">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Total this month</p>
          <p className="mt-1 text-xl font-semibold">{pkr(total)}</p>
          <ul className="mt-4 space-y-1.5 text-sm">
            {[...byCategory.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => (
                <li key={cat} className="flex justify-between gap-3">
                  <span className="text-zinc-600">{cat}</span>
                  <span className="tabular-nums">{amt.toLocaleString("en-PK")}</span>
                </li>
              ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
