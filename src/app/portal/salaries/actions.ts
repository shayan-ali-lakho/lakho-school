"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { PAYROLL_ROLES, dayOffDeduction, parseMonth } from "@/lib/finance";
import { optionalText, text } from "@/lib/form";

/** Create the month's salary lines for every active teacher, starting from their base salary. Safe to run twice. */
export async function generateSalaries(formData: FormData) {
  await requireRole(PAYROLL_ROLES);
  const month = parseMonth(text(formData, "month"));

  const teachers = await db.teacher.findMany({
    where: { user: { isActive: true } },
    select: { id: true, baseSalary: true },
  });
  await db.salaryRecord.createMany({
    data: teachers.map((t) => ({ teacherId: t.id, month, baseSalary: t.baseSalary })),
    skipDuplicates: true,
  });
  revalidatePath("/portal/salaries");
  redirect(`/portal/salaries?month=${month}&ok=Salary+lines+created.`);
}

const lineSchema = z.object({
  baseSalary: z.coerce.number().int("Enter whole numbers").min(0, "Amounts cannot be negative").max(10_000_000),
  daysOff: z.coerce.number().int("Days off must be a whole number").min(0, "Days off cannot be negative").max(30, "Days off cannot be more than 30"),
});

export async function saveSalary(formData: FormData) {
  await requireRole(PAYROLL_ROLES);
  const id = text(formData, "id");
  const month = parseMonth(text(formData, "month"));
  const back = `/portal/salaries?month=${month}`;

  const parsed = lineSchema.safeParse({
    baseSalary: text(formData, "baseSalary") || "0",
    daysOff: text(formData, "daysOff") || "0",
  });
  if (!parsed.success) redirect(`${back}&error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const v = parsed.data;

  const record = await db.salaryRecord.findUnique({ where: { id }, select: { paidOn: true } });
  if (!record) redirect(`${back}&error=Salary+line+not+found`);
  if (record.paidOn) redirect(`${back}&error=${encodeURIComponent("This salary is already paid. Mark it unpaid to change it.")}`);

  await db.salaryRecord.update({ where: { id }, data: { baseSalary: v.baseSalary, daysOff: v.daysOff, allowances: 0, deductions: dayOffDeduction(v.baseSalary, v.daysOff), note: optionalText(formData, "note") ?? null } });
  revalidatePath("/portal/salaries");
  redirect(`${back}&ok=Salary+saved.`);
}

export async function setSalaryPaid(formData: FormData) {
  await requireRole(PAYROLL_ROLES);
  const id = text(formData, "id");
  const month = parseMonth(text(formData, "month"));
  const paid = text(formData, "paid") === "true";

  await db.salaryRecord.update({ where: { id }, data: { paidOn: paid ? new Date() : null } });
  revalidatePath("/portal/salaries");
  redirect(`/portal/salaries?month=${month}&ok=${paid ? "Marked+as+paid." : "Marked+as+unpaid."}`);
}
