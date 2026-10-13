import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAFF_ROLES } from "@/lib/roles";
import { computeResults } from "@/lib/academics";
import { PrintButton } from "@/components/portal/print-button";

export const metadata: Metadata = { title: "Exam results" };

export default async function ResultsPage(props: PageProps<"/portal/exams/[id]/results">) {
  await requireRole(STAFF_ROLES);
  const { id } = await props.params;

  const exam = await db.exam.findUnique({
    where: { id },
    select: { name: true, kind: true, classId: true, totalMarks: true, passPercent: true, class: { select: { name: true, section: true } } },
  });
  if (!exam) notFound();

  const [courses, students, marks] = await Promise.all([
    db.course.findMany({ where: { classId: exam.classId }, orderBy: { subject: { name: "asc" } }, select: { subjectId: true, subject: { select: { name: true } } } }),
    db.student.findMany({
      where: { classId: exam.classId, user: { isActive: true } },
      orderBy: { rollNumber: "asc" },
      select: { id: true, rollNumber: true, user: { select: { name: true } } },
    }),
    db.mark.findMany({ where: { examId: id }, select: { studentId: true, subjectId: true, obtained: true } }),
  ]);

  const results = computeResults({
    students: students.map((s) => ({ id: s.id, name: s.user.name, rollNumber: s.rollNumber })),
    subjectIds: courses.map((c) => c.subjectId),
    marks,
    totalMarks: exam.totalMarks,
    passPercent: exam.passPercent,
  });

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Link href={`/portal/exams/${id}`} className="text-sm text-emerald-700 hover:underline">← {exam.name}</Link>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{exam.name}: results</h1>
          <p className="mt-1 text-zinc-600">{exam.kind} · {exam.class.name} {exam.class.section} · out of {exam.totalMarks} per subject</p>
        </div>
        <PrintButton />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-3 py-3 font-medium">Roll</th>
              <th className="px-3 py-3 font-medium">Student</th>
              {courses.map((c) => <th key={c.subjectId} className="px-3 py-3 text-right font-medium">{c.subject.name}</th>)}
              <th className="px-3 py-3 text-right font-medium">Total</th>
              <th className="px-3 py-3 text-right font-medium">%</th>
              <th className="px-3 py-3 font-medium">Grade</th>
              <th className="px-3 py-3 font-medium">Position</th>
              <th className="px-3 py-3 font-medium">Result</th>
              <th className="px-3 py-3 print:hidden" />
            </tr>
          </thead>
          <tbody>
            {results.length === 0 && (
              <tr><td colSpan={courses.length + 8} className="px-4 py-6 text-center text-zinc-500">No students in this class.</td></tr>
            )}
            {results.map((r) => (
              <tr key={r.studentId} className="border-b border-zinc-100 last:border-0">
                <td className="px-3 py-2">{r.rollNumber}</td>
                <td className="px-3 py-2">{r.name}</td>
                {courses.map((c) => {
                  const v = r.perSubject.get(c.subjectId);
                  const low = v != null && (v / exam.totalMarks) * 100 < exam.passPercent;
                  return <td key={c.subjectId} className={`px-3 py-2 text-right tabular-nums ${low ? "text-red-700" : ""}`}>{v ?? "-"}</td>;
                })}
                <td className="px-3 py-2 text-right tabular-nums">{r.possible ? `${r.obtained}/${r.possible}` : "-"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.possible ? r.percent.toFixed(1) : "-"}</td>
                <td className="px-3 py-2">{r.grade}</td>
                <td className="px-3 py-2">{r.position ?? "-"}</td>
                <td className={`px-3 py-2 ${r.possible ? (r.passed ? "text-emerald-700" : "text-red-700") : ""}`}>{r.possible ? (r.passed ? "Pass" : "Fail") : "-"}</td>
                <td className="px-3 py-2 text-right print:hidden">
                  <Link href={`/portal/exams/${id}/report/${r.studentId}`} className="text-emerald-700 hover:underline">Report card</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500 print:hidden">
        Totals only count subjects that have marks entered. A student fails if any subject is below {exam.passPercent}%.
      </p>
    </div>
  );
}
