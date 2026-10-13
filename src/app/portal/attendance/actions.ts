"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { teacherIdFor } from "@/lib/class-access";
import { todayKarachi } from "@/lib/finance";
import { text } from "@/lib/form";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "LEAVE"] as const;
type Status = (typeof STATUSES)[number];

/** Save attendance for a whole class on one date. Inputs are named s_<studentId>. */
export async function saveAttendance(formData: FormData) {
  const user = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const classId = text(formData, "classId");
  const date = text(formData, "date");
  const back = (q: string): never => redirect(`/portal/attendance?classId=${classId}&date=${date}&${q}`);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayKarachi()) back("error=Choose+today+or+an+earlier+date.");

  if (user.role === "TEACHER") {
    const tid = await teacherIdFor(user.id);
    const mine = tid
      ? await db.class.findFirst({
          where: { id: classId, OR: [{ classTeacherId: tid }, { courses: { some: { teacherId: tid } } }] },
          select: { id: true },
        })
      : null;
    if (!mine) back("error=You+can+only+mark+attendance+for+your+own+classes.");
  }

  const students = await db.student.findMany({ where: { classId, user: { isActive: true } }, select: { id: true } });
  const valid = new Set(students.map((s) => s.id));
  const day = new Date(`${date}T00:00:00.000Z`);

  const rows: { studentId: string; status: Status }[] = [];
  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("s_") || typeof raw !== "string") continue;
    const studentId = key.slice(2);
    if (valid.has(studentId) && (STATUSES as readonly string[]).includes(raw)) rows.push({ studentId, status: raw as Status });
  }

  await db.$transaction(
    rows.map((r) =>
      db.attendance.upsert({
        where: { studentId_date: { studentId: r.studentId, date: day } },
        update: { status: r.status, markedById: user.id },
        create: { studentId: r.studentId, date: day, status: r.status, markedById: user.id },
      }),
    ),
  );
  revalidatePath("/portal/attendance");
  back("saved=1");
}
