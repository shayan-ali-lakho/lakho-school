import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAFF_ROLES, USER_ADMIN_ROLES } from "@/lib/roles";
import { dateOnly } from "@/lib/finance";

export const metadata: Metadata = { title: "Exams and tests" };

export default async function ExamsPage() {
  const user = await requireRole(STAFF_ROLES);
  const canManage = USER_ADMIN_ROLES.includes(user.role);

  const exams = await db.exam.findMany({
    orderBy: [{ examDate: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      name: true,
      kind: true,
      examDate: true,
      totalMarks: true,
      class: { select: { name: true, section: true, academicYear: true } },
      _count: { select: { marks: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Exams and tests</h1>
          <p className="mt-1 text-zinc-600">Monthly tests, term examinations and results.</p>
        </div>
        {canManage && (
          <Link href="/portal/exams/new" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            Create exam
          </Link>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Exam</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Marks entered</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {exams.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-500">No exams yet.</td></tr>
            )}
            {exams.map((e) => (
              <tr key={e.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/portal/exams/${e.id}`} className="text-emerald-700 hover:underline">{e.name}</Link>
                  <div className="text-xs text-zinc-500">Out of {e.totalMarks} per subject</div>
                </td>
                <td className="px-4 py-3">{e.kind}</td>
                <td className="px-4 py-3">{e.class.name} {e.class.section} ({e.class.academicYear})</td>
                <td className="px-4 py-3">{e.examDate ? dateOnly(e.examDate) : "-"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{e._count.marks}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/portal/exams/${e.id}/results`} className="text-emerald-700 hover:underline">Results</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
