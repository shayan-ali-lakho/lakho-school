import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { STAFF_ROLES } from "@/lib/roles";
import { computeResults, gradeFor } from "@/lib/academics";
import { dateOnly } from "@/lib/finance";
import { site } from "@/lib/site";
import { PrintButton } from "@/components/portal/print-button";

export const metadata: Metadata = { title: "Report card" };

export default async function ReportCardPage(props: PageProps<"/portal/exams/[id]/report/[studentId]">) {
  const user = await requireUser();
  const { id, studentId } = await props.params;

  const exam = await db.exam.findUnique({
    where: { id },
    select: { name: true, kind: true, classId: true, examDate: true, totalMarks: true, passPercent: true, class: { select: { name: true, section: true, academicYear: true } } },
  });
  if (!exam) notFound();

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, userId: true, classId: true, rollNumber: true, user: { select: { name: true } }, guardian: { select: { userId: true, user: { select: { name: true } } } } },
  });
  if (!student || student.classId !== exam.classId) notFound();

  const allowed =
    STAFF_ROLES.includes(user.role) ||
    (user.role === "STUDENT" && student.userId === user.id) ||
    (user.role === "PARENT" && student.guardian?.userId === user.id);
  if (!allowed) redirect("/portal");

  const [courses, classmates, marks] = await Promise.all([
    db.course.findMany({ where: { classId: exam.classId }, orderBy: { subject: { name: "asc" } }, select: { subjectId: true, subject: { select: { name: true } } } }),
    db.student.findMany({
      where: { classId: exam.classId, user: { isActive: true } },
      select: { id: true, rollNumber: true, user: { select: { name: true } } },
    }),
    db.mark.findMany({ where: { examId: id }, select: { studentId: true, subjectId: true, obtained: true } }),
  ]);

  const results = computeResults({
    students: classmates.map((s) => ({ id: s.id, name: s.user.name, rollNumber: s.rollNumber })),
    subjectIds: courses.map((c) => c.subjectId),
    marks,
    totalMarks: exam.totalMarks,
    passPercent: exam.passPercent,
  });
  const me = results.find((r) => r.studentId === studentId);
  const ranked = results.filter((r) => r.position !== null).length;

  const backHref = STAFF_ROLES.includes(user.role) ? `/portal/exams/${id}/results` : "/portal/results";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href={backHref} className="text-sm text-emerald-700 hover:underline">← Back</Link>
        <PrintButton />
      </div>

      <article className="rounded-lg border border-zinc-300 bg-white p-8 print:border-0 print:p-0">
        <header className="border-b border-zinc-200 pb-4 text-center">
          <p className="text-xl font-semibold">{site.name}</p>
          {site.address && <p className="text-sm text-zinc-600">{site.address}</p>}
          <h1 className="mt-3 text-lg font-semibold tracking-tight">Report card: {exam.name}</h1>
          <p className="text-sm text-zinc-600">{exam.kind}{exam.examDate ? ` · ${dateOnly(exam.examDate)}` : ""}</p>
        </header>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-zinc-500">Student</dt><dd className="font-medium">{student.user.name}</dd></div>
          <div className="flex justify-between"><dt className="text-zinc-500">Roll number</dt><dd>{student.rollNumber}</dd></div>
          <div className="flex justify-between"><dt className="text-zinc-500">Class</dt><dd>{exam.class.name} {exam.class.section}</dd></div>
          <div className="flex justify-between"><dt className="text-zinc-500">Session</dt><dd>{exam.class.academicYear}</dd></div>
          {student.guardian && <div className="col-span-2 flex justify-between"><dt className="text-zinc-500">Parent / guardian</dt><dd>{student.guardian.user.name}</dd></div>}
        </dl>

        <table className="mt-5 w-full text-left text-sm">
          <thead className="border-y border-zinc-300 bg-zinc-50">
            <tr>
              <th className="px-3 py-2 font-medium">Subject</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="px-3 py-2 text-right font-medium">Obtained</th>
              <th className="px-3 py-2 text-right font-medium">%</th>
              <th className="px-3 py-2 font-medium">Grade</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-zinc-500">No subjects.</td></tr>}
            {courses.map((c) => {
              const v = me?.perSubject.get(c.subjectId);
              const pct = v != null ? (v / exam.totalMarks) * 100 : null;
              return (
                <tr key={c.subjectId} className="border-b border-zinc-100">
                  <td className="px-3 py-2">{c.subject.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{exam.totalMarks}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{v ?? "-"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{pct != null ? pct.toFixed(1) : "-"}</td>
                  <td className="px-3 py-2">{pct != null ? gradeFor(pct, exam.passPercent) : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {me && me.possible > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-md bg-zinc-50 p-3"><p className="text-zinc-500">Total</p><p className="font-semibold">{me.obtained} / {me.possible}</p></div>
            <div className="rounded-md bg-zinc-50 p-3"><p className="text-zinc-500">Percentage</p><p className="font-semibold">{me.percent.toFixed(1)}%</p></div>
            <div className="rounded-md bg-zinc-50 p-3"><p className="text-zinc-500">Grade</p><p className="font-semibold">{me.grade}</p></div>
            <div className="rounded-md bg-zinc-50 p-3"><p className="text-zinc-500">Position</p><p className="font-semibold">{me.position} of {ranked}</p></div>
            <p className={`col-span-2 text-base font-semibold sm:col-span-4 ${me.passed ? "text-emerald-700" : "text-red-700"}`}>
              Result: {me.passed ? "Pass" : "Fail"}
            </p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-zinc-500">Marks have not been entered yet.</p>
        )}

        <div className="mt-10 grid grid-cols-2 gap-10 text-center text-xs text-zinc-500">
          <p className="border-t border-zinc-400 pt-1">Class teacher</p>
          <p className="border-t border-zinc-400 pt-1">Principal</p>
        </div>
      </article>
    </div>
  );
}
