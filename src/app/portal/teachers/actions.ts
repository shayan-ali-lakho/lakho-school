"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import {
  accountSchema,
  assertEmailFree,
  DuplicateEmailError,
  hashPassword,
} from "@/lib/accounts";
import { firstIssue, optionalText, text, type FormState } from "@/lib/form";

const teacherSchema = accountSchema.omit({ role: true }).extend({
  employeeId: z.string().max(40).optional(),
  phone: z.string().max(30).optional(),
  qualification: z.string().max(200).optional(),
  position: z.string().max(100).optional(),
  baseSalary: z.coerce.number().int("must be a whole number").min(0, "cannot be negative").max(10_000_000),
});

export async function createTeacher(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(USER_ADMIN_ROLES);

  const parsed = teacherSchema.safeParse({
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: text(formData, "password"),
    employeeId: optionalText(formData, "employeeId"),
    phone: optionalText(formData, "phone"),
    qualification: optionalText(formData, "qualification"),
    position: optionalText(formData, "position"),
    baseSalary: text(formData, "baseSalary") || "0",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { name, email, password, employeeId, phone, qualification, position, baseSalary } = parsed.data;

  try {
    await assertEmailFree(email);
  } catch (e) {
    if (e instanceof DuplicateEmailError) return { error: e.message };
    throw e;
  }

  if (employeeId) {
    const clash = await db.teacher.findUnique({ where: { employeeId }, select: { id: true } });
    if (clash) return { error: `Employee ID ${employeeId} is already used by another teacher.` };
  }

  // One write creates the login and the teacher profile together.
  await db.user.create({
    data: {
      name,
      email,
      role: "TEACHER",
      passwordHash: await hashPassword(password),
      teacherProfile: { create: { employeeId, phone, qualification, position, baseSalary } },
    },
  });

  revalidatePath("/portal/teachers");
  redirect("/portal/teachers?ok=Teacher+added.");
}

const editSchema = z.object({
  name: z.string().trim().min(2, "is required").max(100),
  employeeId: z.string().max(40).optional(),
  phone: z.string().max(30).optional(),
  qualification: z.string().max(200).optional(),
  position: z.string().max(100).optional(),
  baseSalary: z.coerce.number().int("must be a whole number").min(0, "cannot be negative").max(10_000_000),
});

export async function updateTeacher(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(USER_ADMIN_ROLES);
  const id = text(formData, "id");

  const parsed = editSchema.safeParse({
    name: text(formData, "name"),
    employeeId: optionalText(formData, "employeeId"),
    phone: optionalText(formData, "phone"),
    qualification: optionalText(formData, "qualification"),
    position: optionalText(formData, "position"),
    baseSalary: text(formData, "baseSalary") || "0",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const t = parsed.data;

  const teacher = await db.teacher.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!teacher) return { error: "Teacher not found." };

  if (t.employeeId) {
    const clash = await db.teacher.findUnique({ where: { employeeId: t.employeeId }, select: { id: true } });
    if (clash && clash.id !== id) return { error: `Employee ID ${t.employeeId} is already used by another teacher.` };
  }

  await db.$transaction([
    db.user.update({ where: { id: teacher.userId }, data: { name: t.name } }),
    db.teacher.update({
      where: { id },
      data: {
        employeeId: t.employeeId ?? null,
        phone: t.phone ?? null,
        qualification: t.qualification ?? null,
        position: t.position ?? null,
        baseSalary: t.baseSalary,
      },
    }),
  ]);

  revalidatePath("/portal", "layout");
  redirect("/portal/teachers?ok=Teacher+updated.");
}
