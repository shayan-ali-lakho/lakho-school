import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { FINANCE_ROLES } from "@/lib/finance";
import { Card } from "@/components/fields";
import { saveClassFees } from "../actions";

export const metadata: Metadata = { title: "Class fees" };

export default async function ClassFeesPage(props: PageProps<"/portal/fees/structure">) {
  await requireRole(FINANCE_ROLES);
  const { saved } = await props.searchParams;

  const classes = await db.class.findMany({
    orderBy: [{ academicYear: "desc" }, { name: "asc" }, { section: "asc" }],
    select: { id: true, name: true, section: true, academicYear: true, monthlyFee: true, _count: { select: { students: true } } },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Class fees</h1>
        <p className="mt-1 text-zinc-600">
          The monthly tuition fee for each class, in PKR. Changing a fee affects invoices created from now on, not
          invoices that already exist. A single student&apos;s discount is set on their edit page.
        </p>
      </div>
      {saved && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Fees saved.</p>}
      <Card>
        {classes.length === 0 ? (
          <p className="text-zinc-500">No classes yet. Add classes first.</p>
        ) : (
          <form action={saveClassFees} className="space-y-4">
            <ul className="divide-y divide-zinc-100">
              {classes.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                  <label htmlFor={`fee_${c.id}`}>
                    <span className="font-medium">
                      {c.name} {c.section}
                    </span>
                    <span className="ml-2 text-sm text-zinc-500">
                      {c.academicYear} · {c._count.students} students
                    </span>
                  </label>
                  <input
                    id={`fee_${c.id}`}
                    name={`fee_${c.id}`}
                    type="number"
                    min={0}
                    defaultValue={c.monthlyFee}
                    className="w-32 rounded-md border border-zinc-300 px-3 py-1.5 text-right"
                  />
                </li>
              ))}
            </ul>
            <button type="submit" className="rounded-md bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800">
              Save fees
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
