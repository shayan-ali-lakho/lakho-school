"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { firstIssue, optionalText, text, type FormState } from "@/lib/form";

const classSchema = z.object({
  name: z.string().trim().min(1, "is required").max(50),
  section: z.string().trim().min(1, "is required").max(10),
  academicYear: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/, "must look like 2026-2027"),
  classTeacherId: z.string().optional(),
});

export async function createClass(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(USER_ADMIN_ROLES);

  const parsed = classSchema.safeParse({
    name: text(formData, "name"),
    section: text(formData, "section"),
    academicYear: text(formData, "academicYear"),
    classTeacherId: optionalText(formData, "classTeacherId"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { name, section, academicYear, classTeacherId } = parsed.data;

  const clash = await db.class.findUnique({
    where: { name_section_academicYear: { name, section, academicYear } },
    select: { id: true },
  });
  if (clash) return { error: `${name} ${section} already exists for ${academicYear}.` };

  if (classTeacherId) {
    const teacher = await db.teacher.findUnique({ where: { id: classTeacherId }, select: { id: true } });
    if (!teacher) return { error: "Selected teacher was not found." };
  }

  const created = await db.class.create({
    data: { name, section, academicYear, classTeacherId },
    select: { id: true },
  });

  revalidatePath("/portal/classes");
  redirect(`/portal/classes/${created.id}?ok=Class+added.`);
}
