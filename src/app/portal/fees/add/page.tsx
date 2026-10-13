import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { FINANCE_ROLES, currentMonth } from "@/lib/finance";
import { AddFeeForm } from "@/components/portal/add-fee-form";

export const metadata: Metadata = { title: "Add fees" };

export default async function AddFeesPage() {
  await requireRole(FINANCE_ROLES);

  const [classes, students] = await Promise.all([
    db.class.findMany({
      orderBy: [{ academicYear: "desc" }, { name: "asc" }, { section: "asc" }],
      select: { id: true, name: true, section: true, academicYear: true },
    }),
    db.student.findMany({
      where: { user: { isActive: true } },
      orderBy: [{ class: { name: "asc" } }, { rollNumber: "asc" }],
      select: {
        id: true,
        rollNumber: true,
        classId: true,
        monthlyFee: true,
        feeDiscount: true,
        user: { select: { name: true } },
        class: { select: { name: true, section: true, monthlyFee: true } },
      },
    }),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add fees</h1>
        <p className="mt-1 text-zinc-600">
          Pick the fee type, month and student, then enter the fee and the amount received. Monthly fees fill in
          automatically from the student&apos;s monthly fee.
        </p>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <AddFeeForm
          defaultMonth={currentMonth()}
          classes={classes.map((c) => ({ id: c.id, label: `${c.name} ${c.section} (${c.academicYear})` }))}
          students={students.map((s) => ({
            id: s.id,
            name: s.user.name,
            roll: s.rollNumber,
            classId: s.classId ?? "",
            classLabel: s.class ? `${s.class.name} ${s.class.section}` : "No class",
            monthlyFee: s.monthlyFee ?? Math.max(0, (s.class?.monthlyFee ?? 0) - s.feeDiscount),
          }))}
        />
      </div>
    </div>
  );
}
