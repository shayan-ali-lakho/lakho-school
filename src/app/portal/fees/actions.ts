"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { FINANCE_ROLES, PAYMENT_METHODS, parseMonth } from "@/lib/finance";
import { optionalText, text } from "@/lib/form";

/** Create this month's invoice for every active student whose class has a fee. Safe to run twice. */
export async function generateInvoices(formData: FormData) {
  await requireRole(FINANCE_ROLES);
  const month = parseMonth(text(formData, "month"));

  const students = await db.student.findMany({
    where: { user: { isActive: true }, class: { monthlyFee: { gt: 0 } } },
    select: { id: true, feeDiscount: true, class: { select: { monthlyFee: true } } },
  });

  const data = students
    .map((s) => ({ studentId: s.id, month, amount: Math.max(0, (s.class?.monthlyFee ?? 0) - s.feeDiscount) }))
    .filter((r) => r.amount > 0);

  await db.feeInvoice.createMany({ data, skipDuplicates: true });
  revalidatePath("/portal/fees");
  redirect(`/portal/fees?month=${month}`);
}

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().int("Enter a whole number").positive("Enter an amount above zero"),
  method: z.enum(PAYMENT_METHODS),
});

/** Record a payment against an invoice, then open the receipt. */
export async function recordPayment(formData: FormData) {
  const actor = await requireRole(FINANCE_ROLES);
  const month = parseMonth(text(formData, "month"));

  const parsed = paymentSchema.safeParse({
    invoiceId: text(formData, "invoiceId"),
    amount: text(formData, "amount"),
    method: text(formData, "method"),
  });
  if (!parsed.success) redirect(`/portal/fees?month=${month}&error=${encodeURIComponent(parsed.error.issues[0].message)}`);

  const { invoiceId, amount, method } = parsed.data;
  const invoice = await db.feeInvoice.findUnique({
    where: { id: invoiceId },
    select: { amount: true, payments: { select: { amount: true } } },
  });
  if (!invoice) redirect(`/portal/fees?month=${month}&error=Invoice+not+found`);

  const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  if (amount > invoice.amount - paid) {
    redirect(`/portal/fees?month=${month}&error=${encodeURIComponent("That is more than the balance due.")}`);
  }

  const payment = await db.feePayment.create({
    data: { invoiceId, amount, method, note: optionalText(formData, "note"), receivedById: actor.id },
    select: { id: true },
  });

  revalidatePath("/portal/fees");
  redirect(`/portal/fees/receipt/${payment.id}`);
}

/** Save the monthly fee of every class from one form (inputs are named fee_<classId>). */
export async function saveClassFees(formData: FormData) {
  await requireRole(FINANCE_ROLES);
  const updates: { id: string; fee: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("fee_") || typeof value !== "string") continue;
    const fee = Number(value.trim() === "" ? "0" : value);
    if (Number.isInteger(fee) && fee >= 0 && fee <= 1_000_000) updates.push({ id: key.slice(4), fee });
  }
  await db.$transaction(updates.map((u) => db.class.update({ where: { id: u.id }, data: { monthlyFee: u.fee } })));
  revalidatePath("/portal/fees", "layout");
  redirect("/portal/fees/structure?saved=1");
}
