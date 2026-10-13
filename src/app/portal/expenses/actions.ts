"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { EXPENSE_CATEGORIES, FINANCE_ROLES, parseMonth } from "@/lib/finance";
import { text } from "@/lib/form";

const schema = z.object({
  date: z.iso.date("Enter a valid date"),
  category: z.enum(EXPENSE_CATEGORIES, "Choose a category"),
  description: z.string().trim().min(2, "Describe the expense").max(200),
  amount: z.coerce.number().int("Enter a whole number").positive("Enter an amount above zero").max(100_000_000),
});

export async function addExpense(formData: FormData) {
  const actor = await requireRole(FINANCE_ROLES);

  const parsed = schema.safeParse({
    date: text(formData, "date"),
    category: text(formData, "category"),
    description: text(formData, "description"),
    amount: text(formData, "amount"),
  });
  const month = parseMonth(text(formData, "month"));
  if (!parsed.success) redirect(`/portal/expenses?month=${month}&error=${encodeURIComponent(parsed.error.issues[0].message)}`);

  const v = parsed.data;
  await db.expense.create({
    data: { date: new Date(`${v.date}T00:00:00.000Z`), category: v.category, description: v.description, amount: v.amount, createdById: actor.id },
  });
  revalidatePath("/portal/expenses");
  redirect(`/portal/expenses?month=${v.date.slice(0, 7)}`);
}

export async function deleteExpense(formData: FormData) {
  await requireRole(FINANCE_ROLES);
  const month = parseMonth(text(formData, "month"));
  await db.expense.delete({ where: { id: text(formData, "id") } }).catch(() => undefined);
  revalidatePath("/portal/expenses");
  redirect(`/portal/expenses?month=${month}`);
}
