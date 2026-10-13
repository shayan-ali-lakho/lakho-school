import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAFF_ROLES, USER_ADMIN_ROLES } from "@/lib/roles";
import { teacherIdFor } from "@/lib/class-access";
import { deleteExam, saveMarks } from "../actions";

export const metadata: Metadata = { title: "Exam" };

export default async function ExamPage(props: PageProps<"/portal/exams/[id]">) {
  const user = await requireRole(STAFF_ROLES);
  const { id } = await props.params;
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const exam = await db.exam.findUnique({
    where: { id },
    select: { id: true, name: true, kind: true, classId: true, totalMarks: true, passPercent: true, class: { select: { name: true, section: true } } },
  });
  if (!exam) notFound();
  const canManage = USER_ADMIN_ROLES.includes(user.role);

  // Subjects the signed-in person may enter marks for.
  const myTeacherId = user.role === "TEACHER" ? await teacherIdFor(user.id) : null;
  const courses = await db.course.findMany({
    where: { classId: exam.classId, ...(user.role === "TEACHER" ? { teacherId: myTeacherId ?? "none" } : {}) },
    orderBy: { subject: { name: "asc" } },
    select: { subjectId: true, subject: { select: { name: true } } },
  });
  const subjectId = courses.find((c) => c.subjectId === sp.subjectId)?.subjectId ?? courses[0]?.subjectId;
  const canEnter = canManage || user.role === "TEACHER";

  const students = await db.student.findMany({
    where: { classId: exam.classId, user: { isActive: true } },
    orderBy: { rollNumber: "asc" },
    select: { id: true, rollNumber: true, user: { select: { name: true } } },
  });
  const marks = subjectId
    ? await db.mark.findMany({ where: { examId: id, subjectId }, select: { studentId: true, obtained: true } })
    : [];
  const byStudent = new Map(marks.map((m) => [m.studentId, m.obtained]));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal/exams" className="text-sm text-emerald-700 hover:underline">← Exams</Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{exam.name}</h1>
            <p className="mt-1 text-zinc-600">
              {exam.kind} · {exam.class.name} {exam.class.section} · out of {exam.totalMarks} per subject · pass at {exam.passPercent}%
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/portal/exams/${id}/results`} className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-100">
              View results
            </Link>
            {canManage && (
              <form action={deleteExam}>
                <input type="hidden" name="id" value={id} />
                <button type="submit" className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
                  Delete exam
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {sp.saved && <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Marks saved.</p>}

      {courses.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-zinc-600">
          {user.role === "TEACHER"
            ? "You are not assigned to teach any subject in this class."
            : "This class has no subjects yet. Add them under Courses, then come back to enter marks."}
        </p>
      ) : (
        <section className="space-y-4">
          <form method="get" className="flex items-center gap-2 text-sm">
            <label htmlFor="subjectId" className="text-zinc-600">Subject</label>
            <select id="subjectId" name="subjectId" defaultValue={subjectId} className="rounded-md border border-zinc-300 bg-white px-2 py-1.5">
              {courses.map((c) => <option key={c.subjectId} value={c.subjectId}>{c.subject.name}</option>)}
            </select>
            <button type="submit" className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100">Show</button>
          </form>

          <form action={saveMarks} className="space-y-4">
            <input type="hidden" name="examId" value={id} />
            <input type="hidden" name="subjectId" value={subjectId} />
            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Roll no.</th>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Marks (out of {exam.totalMarks})</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-zinc-500">No students in this class.</td></tr>
                  )}
                  {students.map((s) => (
                    <tr key={s.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-2">{s.rollNumber}</td>
                      <td className="px-4 py-2">{s.user.name}</td>
                      <td className="px-4 py-2">
                        <input
                          name={`m_${s.id}`}
                          type="number"
                          min={0}
                          max={exam.totalMarks}
                          defaultValue={byStudent.get(s.id) ?? ""}
                          disabled={!canEnter}
                          aria-label={`Marks for ${s.user.name}`}
                          className="w-24 rounded-md border border-zinc-300 px-2 py-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {canEnter && students.length > 0 && (
              <button type="submit" className="rounded-md bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800">
                Save marks
              </button>
            )}
          </form>
        </section>
      )}
    </div>
  );
}
