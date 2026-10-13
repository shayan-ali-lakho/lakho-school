import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { FINANCE_ROLES } from "@/lib/finance";
import { Card } from "@/components/fields";
import { saveClassFees, saveStudentFees } from "../actions";

export const metadata: Metadata = { title: "Class fees" };

export default async function ClassFeesPage(props: PageProps<"/portal/fees/structure">) {
  await requireRole(FINANCE_ROLES);
  const sp = await props.searchParams;

  const classes = await db.class.findMany({
    orderBy: [{ academicYear: "desc" }, { name: "asc" }, { section: "asc" }],
    select: { id: true, name: true, section: true, academicYear: true, monthlyFee: true, _count: { select: { students: true } } },
  });

  const pickedClass = classes.find((c) => c.id === sp.classId) ?? classes[0];
  const students = pickedClass
    ? await db.student.findMany({
        where: { classId: pickedClass.id, user: { isActive: true } },
        orderBy: { rollNumber: "asc" },
        select: { id: true, rollNumber: true, monthlyFee: true, feeDiscount: true, user: { select: { name: true } } },
      })
    : [];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Class fees</h1>
        <p className="mt-1 text-zinc-600">
          The monthly tuition fee for each class, in PKR. Changing a fee affects invoices created from now on, not
          invoices that already exist. Each student can also have their own monthly fee, set below.
        </p>
      </div>
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

      {pickedClass && (
        <Card title="Monthly fee for each student">
          <form method="get" className="mb-4 flex items-center gap-2 text-sm">
            <label htmlFor="classId" className="text-zinc-600">Class</label>
            <select id="classId" name="classId" defaultValue={pickedClass.id} className="rounded-md border border-zinc-300 bg-white px-2 py-1.5">
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.section} ({c.academicYear})</option>
              ))}
            </select>
            <button type="submit" className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100">Show</button>
          </form>
          {students.length === 0 ? (
            <p className="text-zinc-500">No students in this class.</p>
          ) : (
            <form action={saveStudentFees} className="space-y-4">
              <input type="hidden" name="classId" value={pickedClass.id} />
              <p className="text-sm text-zinc-500">
                Leave a box empty to charge the class fee ({pickedClass.monthlyFee.toLocaleString("en-PK")} PKR).
              </p>
              <ul className="divide-y divide-zinc-100">
                {students.map((st) => (
                  <li key={st.id} className="flex items-center justify-between gap-4 py-2">
                    <label htmlFor={`sf_${st.id}`}>
                      <span className="text-sm text-zinc-500">{st.rollNumber}</span>
                      <span className="ml-2 font-medium">{st.user.name}</span>
                    </label>
                    <input
                      id={`sf_${st.id}`}
                      name={`sf_${st.id}`}
                      type="number"
                      min={0}
                      defaultValue={st.monthlyFee ?? ""}
                      placeholder={String(Math.max(0, pickedClass.monthlyFee - st.feeDiscount))}
                      className="w-32 rounded-md border border-zinc-300 px-3 py-1.5 text-right"
                    />
                  </li>
                ))}
              </ul>
              <button type="submit" className="rounded-md bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800">
                Save student fees
              </button>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
