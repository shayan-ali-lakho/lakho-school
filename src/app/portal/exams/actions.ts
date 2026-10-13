"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAFF_ROLES, USER_ADMIN_ROLES } from "@/lib/roles";
import { EXAM_KINDS } from "@/lib/academics";
import { teacherIdFor } from "@/lib/class-access";
import { firstIssue, optionalText, text, type FormState } from "@/lib/form";

const examSchema = z.object({
  name: z.string().trim().min(2, "is required").max(100),
  kind: z.enum(EXAM_KINDS, "Choose a type"),
  classId: z.string().min(1, "Choose a class"),
  examDate: z.iso.date("must be a valid date").optional(),
  totalMarks: z.coerce.number().int("must be a whole number").min(1).max(1000),
  passPercent: z.coerce.number().int("must be a whole number").min(1).max(100),
});

export async function createExam(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(USER_ADMIN_ROLES);

  const parsed = examSchema.safeParse({
    name: text(formData, "name"),
    kind: text(formData, "kind"),
    classId: text(formData, "classId"),
    examDate: optionalText(formData, "examDate"),
    totalMarks: text(formData, "totalMarks") || "100",
    passPercent: text(formData, "passPercent") || "33",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const e = parsed.data;

  const cls = await db.class.findUnique({ where: { id: e.classId }, select: { id: true } });
  if (!cls) return { error: "Class not found." };

  const exam = await db.exam.create({
    data: {
      name: e.name,
      kind: e.kind,
      classId: e.classId,
      examDate: e.examDate ? new Date(`${e.examDate}T00:00:00.000Z`) : null,
      totalMarks: e.totalMarks,
      passPercent: e.passPercent,
    },
    select: { id: true },
  });
  revalidatePath("/portal/exams");
  redirect(`/portal/exams/${exam.id}`);
}

export async function deleteExam(formData: FormData) {
  await requireRole(USER_ADMIN_ROLES);
  await db.exam.delete({ where: { id: text(formData, "id") } }).catch(() => undefined);
  revalidatePath("/portal/exams");
  redirect("/portal/exams");
}

/** Save one subject's marks for a whole class. Inputs are named m_<studentId>; a blank box clears the mark. */
export async function saveMarks(formData: FormData) {
  const user = await requireRole(STAFF_ROLES);
  const examId = text(formData, "examId");
  const subjectId = text(formData, "subjectId");
  const back: (q: string) => never = (q) => redirect(`/portal/exams/${examId}?subjectId=${subjectId}&${q}`);

  const exam = await db.exam.findUnique({ where: { id: examId }, select: { classId: true, totalMarks: true } });
  if (!exam) redirect("/portal/exams");

  const course = await db.course.findUnique({
    where: { classId_subjectId: { classId: exam.classId, subjectId } },
    select: { teacherId: true },
  });
  if (!course) back("error=That+subject+is+not+taught+in+this+class.");

  // Teachers may only enter marks for their own subjects. Admin and principal may enter any.
  if (user.role === "TEACHER") {
    const tid = await teacherIdFor(user.id);
    if (!tid || course.teacherId !== tid) back("error=You+can+only+enter+marks+for+subjects+you+teach.");
  } else if (!USER_ADMIN_ROLES.includes(user.role)) {
    back("error=You+cannot+enter+marks.");
  }

  const students = await db.student.findMany({ where: { classId: exam.classId }, select: { id: true } });
  const valid = new Set(students.map((s) => s.id));

  const rows: { studentId: string; obtained: number | null }[] = [];
  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("m_") || typeof raw !== "string") continue;
    const studentId = key.slice(2);
    if (!valid.has(studentId)) continue;
    const v = raw.trim();
    if (v === "") {
      rows.push({ studentId, obtained: null });
      continue;
    }
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > exam.totalMarks) {
      back(`error=${encodeURIComponent(`Marks must be whole numbers from 0 to ${exam.totalMarks}.`)}`);
    }
    rows.push({ studentId, obtained: n });
  }

  await db.$transaction(
    rows.map((r) =>
      db.mark.upsert({
        where: { examId_studentId_subjectId: { examId, studentId: r.studentId, subjectId } },
        update: { obtained: r.obtained },
        create: { examId, studentId: r.studentId, subjectId, obtained: r.obtained },
      }),
    ),
  );
  revalidatePath(`/portal/exams/${examId}`);
  back("saved=1");
}
