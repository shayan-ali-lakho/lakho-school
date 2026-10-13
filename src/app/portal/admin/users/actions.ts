"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES, type AppRole } from "@/lib/roles";
import { generatePassword } from "@/lib/passwords";
import {
  accountSchema,
  assertEmailFree,
  DuplicateEmailError,
  hashPassword,
  loginIdSchema,
  loginName,
  passwordSchema,
} from "@/lib/accounts";
import { firstIssue, text, type FormState } from "@/lib/form";

/** Only a full administrator may create or modify admin/principal accounts. */
function canManage(actorRole: AppRole, targetRole: AppRole) {
  if (actorRole === "ADMIN") return true;
  return targetRole !== "ADMIN" && targetRole !== "PRINCIPAL";
}

export type CreateUserState =
  | { error?: string; created?: { name: string; login: string; password: string; role: string } }
  | undefined;

// Student accounts need a class and roll number, so they are admitted from the Students page.
const CREATABLE: AppRole[] = ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "PARENT"];

/** Create an account for any staff member or parent. A blank password is generated and shown once. */
export async function createUser(_prev: CreateUserState, formData: FormData): Promise<CreateUserState> {
  const actor = await requireRole(USER_ADMIN_ROLES);

  const typedPassword = text(formData, "password");
  const password = typedPassword || generatePassword();

  const parsed = accountSchema.safeParse({
    name: text(formData, "name"),
    email: text(formData, "email"),
    role: text(formData, "role"),
    password,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const u = parsed.data;

  if (!CREATABLE.includes(u.role)) {
    return { error: "Student accounts are created by admitting the student from the Students page." };
  }
  if (!canManage(actor.role, u.role)) {
    return { error: "Only an administrator can create admin or principal accounts." };
  }

  try {
    await assertEmailFree(u.email);
  } catch (e) {
    if (e instanceof DuplicateEmailError) return { error: `The login name ${loginName(u.email)} is already taken.` };
    throw e;
  }

  await db.user.create({
    data: {
      name: u.name,
      email: u.email,
      role: u.role,
      passwordHash: await hashPassword(u.password),
      ...(u.role === "TEACHER" ? { teacherProfile: { create: {} } } : {}),
      ...(u.role === "PARENT" ? { guardianProfile: { create: {} } } : {}),
    },
  });

  revalidatePath("/portal", "layout");
  return { created: { name: u.name, login: loginName(u.email), password: u.password, role: u.role } };
}

const editSchema = z.object({
  name: z.string().trim().min(2, "is required").max(100),
  email: loginIdSchema,
});

/** Change a user's name and login name (username or email). */
export async function updateUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireRole(USER_ADMIN_ROLES);
  const userId = text(formData, "userId");

  const parsed = editSchema.safeParse({ name: text(formData, "name"), email: text(formData, "email") });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return { error: "User not found." };
  if (!canManage(actor.role, target.role as AppRole)) {
    return { error: "Only an administrator can change this account." };
  }

  const clash = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (clash && clash.id !== userId) {
    return { error: `The login name ${loginName(parsed.data.email)} is already taken.` };
  }

  await db.user.update({ where: { id: userId }, data: { name: parsed.data.name, email: parsed.data.email } });
  revalidatePath("/portal", "layout");
  redirect("/portal/admin/users");
}

export async function setUserActive(formData: FormData) {
  const actor = await requireRole(USER_ADMIN_ROLES);
  const userId = text(formData, "userId");
  const makeActive = text(formData, "active") === "true";

  if (!userId || userId === actor.id) return; // never lock yourself out

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target || !canManage(actor.role, target.role as AppRole)) return;

  await db.user.update({ where: { id: userId }, data: { isActive: makeActive } });

  // A removed teacher can no longer be a class teacher.
  if (!makeActive && target.role === "TEACHER") {
    await db.class.updateMany({ where: { classTeacher: { userId } }, data: { classTeacherId: null } });
  }
  revalidatePath("/portal", "layout");
}

export type LoginState = { error?: string; password?: string; email?: string } | undefined;

/** Sets a new random password and returns it once so the admin can hand it over. */
export async function generateLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const actor = await requireRole(USER_ADMIN_ROLES);
  const userId = text(formData, "userId");

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true, email: true } });
  if (!target) return { error: "User not found." };
  if (!canManage(actor.role, target.role as AppRole)) {
    return { error: "Only an administrator can change this account." };
  }

  const password = generatePassword();
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } });
  return { password, email: loginName(target.email) };
}

// Staff roles an administrator can switch between. Student and parent accounts keep their role.
const ASSIGNABLE: AppRole[] = ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"];

export async function changeRole(formData: FormData) {
  const actor = await requireRole(USER_ADMIN_ROLES);
  const userId = text(formData, "userId");
  const newRole = text(formData, "role") as AppRole;

  if (!userId || userId === actor.id || !ASSIGNABLE.includes(newRole)) return;

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, teacherProfile: { select: { id: true } } },
  });
  if (!target || !ASSIGNABLE.includes(target.role as AppRole)) return;
  if (!canManage(actor.role, target.role as AppRole) || !canManage(actor.role, newRole)) return;

  await db.user.update({
    where: { id: userId },
    data: {
      role: newRole,
      ...(newRole === "TEACHER" && !target.teacherProfile ? { teacherProfile: { create: {} } } : {}),
    },
  });
  revalidatePath("/portal", "layout");
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireRole(USER_ADMIN_ROLES);
  const userId = text(formData, "userId");

  const parsed = passwordSchema.safeParse(text(formData, "password"));
  if (!parsed.success) return { error: `password ${firstIssue(parsed.error)}` };

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return { error: "User not found." };
  if (!canManage(actor.role, target.role as AppRole)) {
    return { error: "Only an administrator can change this account." };
  }

  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(parsed.data) },
  });
  redirect("/portal/admin/users");
}
