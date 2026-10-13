"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { text } from "@/lib/form";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const back = (classId: string, error?: string) =>
  `/portal/timetable?classId=${classId}${error ? `&error=${encodeURIComponent(error)}` : ""}`;

export async function addSlot(formData: FormData) {
  await requireRole(USER_ADMIN_ROLES);
  const classId = text(formData, "classId");
  const courseId = text(formData, "courseId");
  const day = Number(text(formData, "day"));
  const startTime = text(formData, "startTime");
  const endTime = text(formData, "endTime");

  if (!courseId) redirect(back(classId, "Choose a subject."));
  if (!Number.isInteger(day) || day < 1 || day > 6) redirect(back(classId, "Choose a day."));
  if (!TIME.test(startTime) || !TIME.test(endTime)) redirect(back(classId, "Enter the start and end time."));
  if (endTime <= startTime) redirect(back(classId, "The lesson must end after it starts."));

  const course = await db.course.findUnique({ where: { id: courseId }, select: { classId: true, teacherId: true } });
  if (!course || course.classId !== classId) redirect(back(classId, "That subject is not in this class."));

  // Times are zero-padded HH:MM, so plain string comparison orders them correctly.
  const overlaps = { day, startTime: { lt: endTime }, endTime: { gt: startTime } };

  const clash = await db.timetableSlot.findFirst({ where: { ...overlaps, course: { classId } }, select: { id: true } });
  if (clash) redirect(back(classId, "This class already has a lesson at that time."));

  if (course.teacherId) {
    const busy = await db.timetableSlot.findFirst({
      where: { ...overlaps, course: { teacherId: course.teacherId } },
      select: { course: { select: { class: { select: { name: true, section: true } } } } },
    });
    if (busy) {
      const c = busy.course.class;
      redirect(back(classId, `That teacher is already teaching ${c.name} ${c.section} at that time.`));
    }
  }

  await db.timetableSlot.create({ data: { courseId, day, startTime, endTime } });
  revalidatePath("/portal/timetable");
  redirect(back(classId));
}

export async function deleteSlot(formData: FormData) {
  await requireRole(USER_ADMIN_ROLES);
  await db.timetableSlot.delete({ where: { id: text(formData, "id") } }).catch(() => undefined);
  revalidatePath("/portal/timetable");
  redirect(back(text(formData, "classId")));
}
