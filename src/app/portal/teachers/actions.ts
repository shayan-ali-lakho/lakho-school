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
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { name, email, password, employeeId, phone, qualification } = parsed.data;

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
      teacherProfile: { create: { employeeId, phone, qualification } },
    },
  });

  revalidatePath("/portal/teachers");
  redirect("/portal/teachers");
}
