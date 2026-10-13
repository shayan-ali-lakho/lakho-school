"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { optionalText, text } from "@/lib/form";

function back(classId: string, error?: string) {
  const q = new URLSearchParams();
  if (classId) q.set("classId", classId);
  if (error) q.set("error", error);
  return `/portal/courses?${q.toString()}`;
}

export async function addSubject(formData: FormData) {
  await requireRole(USER_ADMIN_ROLES);
  const classId = text(formData, "classId");
  const name = text(formData, "name").replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60) redirect(back(classId, "Enter a subject name (2 to 60 characters)."));

  const exists = await db.subject.findFirst({ where: { name: { equals: name, mode: "insensitive" } }, select: { id: true } });
  if (exists) redirect(back(classId, `${name} already exists.`));
  await db.subject.create({ data: { name } });
  revalidatePath("/portal/courses");
  redirect(back(classId));
}

export async function deleteSubject(formData: FormData) {
  await requireRole(USER_ADMIN_ROLES);
  const classId = text(formData, "classId");
  const id = text(formData, "id");
  const used = await db.course.count({ where: { subjectId: id } });
  if (used > 0) redirect(back(classId, "This subject is taught in a class. Remove it from those classes first."));
  await db.subject.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/portal/courses");
  redirect(back(classId));
}

export async function addCourse(formData: FormData) {
  await requireRole(USER_ADMIN_ROLES);
  const classId = text(formData, "classId");
  const subjectId = text(formData, "subjectId");
  const teacherId = optionalText(formData, "teacherId");
  if (!classId || !subjectId) redirect(back(classId, "Choose a subject."));

  const exists = await db.course.findUnique({ where: { classId_subjectId: { classId, subjectId } }, select: { id: true } });
  if (exists) redirect(back(classId, "That subject is already in this class."));
  await db.course.create({ data: { classId, subjectId, teacherId: teacherId ?? null } });
  revalidatePath("/portal/courses");
  redirect(back(classId));
}

export async function setCourseTeacher(formData: FormData) {
  await requireRole(USER_ADMIN_ROLES);
  const classId = text(formData, "classId");
  await db.course.update({
    where: { id: text(formData, "id") },
    data: { teacherId: optionalText(formData, "teacherId") ?? null },
  });
  revalidatePath("/portal/courses");
  redirect(back(classId));
}

export async function removeCourse(formData: FormData) {
  await requireRole(USER_ADMIN_ROLES);
  const classId = text(formData, "classId");
  await db.course.delete({ where: { id: text(formData, "id") } }).catch(() => undefined);
  revalidatePath("/portal/courses");
  redirect(back(classId));
}
