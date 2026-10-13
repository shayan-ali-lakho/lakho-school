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
  loginIdSchema,
  passwordSchema,
} from "@/lib/accounts";
import { firstIssue, optionalText, text, type FormState } from "@/lib/form";

const studentSchema = accountSchema.omit({ role: true }).extend({
  rollNumber: z.string().trim().min(1, "is required").max(20),
  classId: z.string().min(1, "is required"),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "must be a valid date")
    .optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  address: z.string().max(300).optional(),
});

const newGuardianSchema = z.object({
  guardianName: z.string().trim().min(2, "is required").max(100),
  guardianEmail: loginIdSchema,
  guardianPassword: passwordSchema,
  guardianPhone: z.string().max(30).optional(),
});

export async function admitStudent(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(USER_ADMIN_ROLES);

  const parsed = studentSchema.safeParse({
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: text(formData, "password"),
    rollNumber: text(formData, "rollNumber"),
    classId: text(formData, "classId"),
    dateOfBirth: optionalText(formData, "dateOfBirth"),
    gender: optionalText(formData, "gender"),
    address: optionalText(formData, "address"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const s = parsed.data;

  const cls = await db.class.findUnique({ where: { id: s.classId }, select: { id: true } });
  if (!cls) return { error: "Selected class was not found." };

  const rollClash = await db.student.findUnique({
    where: { classId_rollNumber: { classId: s.classId, rollNumber: s.rollNumber } },
    select: { id: true },
  });
  if (rollClash) return { error: `Roll number ${s.rollNumber} is already used in this class.` };

  // Parent: pick an existing one, or create a new parent account, or leave empty.
  const existingGuardianId = optionalText(formData, "guardianId");
  const newGuardianEmail = optionalText(formData, "guardianEmail");

  let guardianInput:
    | { connect: { id: string } }
    | {
        create: {
          phone?: string;
          user: { create: { name: string; email: string; role: "PARENT"; passwordHash: string } };
        };
      }
    | undefined;

  if (existingGuardianId) {
    const g = await db.guardian.findUnique({ where: { id: existingGuardianId }, select: { id: true } });
    if (!g) return { error: "Selected parent was not found." };
    guardianInput = { connect: { id: g.id } };
  } else if (newGuardianEmail) {
    const gp = newGuardianSchema.safeParse({
      guardianName: text(formData, "guardianName"),
      guardianEmail: newGuardianEmail,
      guardianPassword: text(formData, "guardianPassword"),
      guardianPhone: optionalText(formData, "guardianPhone"),
    });
    if (!gp.success) return { error: firstIssue(gp.error) };
    try {
      await assertEmailFree(gp.data.guardianEmail);
    } catch (e) {
      if (e instanceof DuplicateEmailError) return { error: e.message };
      throw e;
    }
    if (gp.data.guardianEmail === s.email) {
      return { error: "The parent and the student need different login names." };
    }
    guardianInput = {
      create: {
        phone: gp.data.guardianPhone,
        user: {
          create: {
            name: gp.data.guardianName,
            email: gp.data.guardianEmail,
            role: "PARENT",
            passwordHash: await hashPassword(gp.data.guardianPassword),
          },
        },
      },
    };
  }

  try {
    await assertEmailFree(s.email);
  } catch (e) {
    if (e instanceof DuplicateEmailError) return { error: e.message };
    throw e;
  }

  // One write creates the student login, profile and (optionally) the parent together.
  const created = await db.user.create({
    data: {
      name: s.name,
      email: s.email,
      role: "STUDENT",
      passwordHash: await hashPassword(s.password),
      studentProfile: {
        create: {
          rollNumber: s.rollNumber,
          gender: s.gender,
          address: s.address,
          dateOfBirth: s.dateOfBirth ? new Date(`${s.dateOfBirth}T00:00:00.000Z`) : undefined,
          class: { connect: { id: s.classId } },
          guardian: guardianInput,
        },
      },
    },
    select: { studentProfile: { select: { id: true } } },
  });

  revalidatePath("/portal/students");
  revalidatePath("/portal/classes");
  redirect(`/portal/students/${created.studentProfile?.id ?? ""}`);
}

const editSchema = z.object({
  name: z.string().trim().min(2, "is required").max(100),
  rollNumber: z.string().trim().min(1, "is required").max(20),
  classId: z.string().min(1, "is required"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be a valid date").optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  address: z.string().max(300).optional(),
  feeDiscount: z.coerce.number().int("must be a whole number").min(0, "cannot be negative").max(1_000_000),
});

export async function updateStudent(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(USER_ADMIN_ROLES);
  const id = text(formData, "id");

  const parsed = editSchema.safeParse({
    name: text(formData, "name"),
    rollNumber: text(formData, "rollNumber"),
    classId: text(formData, "classId"),
    dateOfBirth: optionalText(formData, "dateOfBirth"),
    gender: optionalText(formData, "gender"),
    address: optionalText(formData, "address"),
    feeDiscount: text(formData, "feeDiscount") || "0",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const s = parsed.data;

  const student = await db.student.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!student) return { error: "Student not found." };

  const clash = await db.student.findUnique({
    where: { classId_rollNumber: { classId: s.classId, rollNumber: s.rollNumber } },
    select: { id: true },
  });
  if (clash && clash.id !== id) return { error: `Roll number ${s.rollNumber} is already used in this class.` };

  await db.$transaction([
    db.user.update({ where: { id: student.userId }, data: { name: s.name } }),
    db.student.update({
      where: { id },
      data: {
        rollNumber: s.rollNumber,
        classId: s.classId,
        feeDiscount: s.feeDiscount,
        gender: s.gender ?? null,
        address: s.address ?? null,
        dateOfBirth: s.dateOfBirth ? new Date(`${s.dateOfBirth}T00:00:00.000Z`) : null,
      },
    }),
  ]);

  revalidatePath("/portal", "layout");
  redirect(`/portal/students/${id}`);
}
