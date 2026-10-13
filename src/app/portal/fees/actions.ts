"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { FEE_TYPES, FEE_TYPE_LABELS, FINANCE_ROLES, PAYMENT_METHODS, monthLabel, parseMonth, pkr } from "@/lib/finance";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { optionalText, text } from "@/lib/form";

/** Only allow going back to a fees page, and add a message to the address. */
function backTo(raw: string, params: Record<string, string>): never {
  const base = raw.startsWith("/portal/fees") && !raw.startsWith("//") ? raw : "/portal/fees";
  const url = new URL(base, "http://local");
  for (const k of ["ok", "error", "receipt"]) url.searchParams.delete(k);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  redirect(url.pathname + url.search);
}

/** Create the monthly fee for every active student who has one (their own fee, or their class fee). Safe to run twice. */
export async function generateInvoices(formData: FormData) {
  await requireRole(FINANCE_ROLES);
  const month = parseMonth(text(formData, "month"));
  const back = text(formData, "back");

  const [students, existing] = await Promise.all([
    db.student.findMany({
      where: { user: { isActive: true } },
      select: { id: true, feeDiscount: true, monthlyFee: true, class: { select: { monthlyFee: true } } },
    }),
    db.feeInvoice.findMany({ where: { month, type: "MONTHLY" }, select: { studentId: true } }),
  ]);
  const have = new Set(existing.map((e) => e.studentId));

  const data = students
    .filter((s) => !have.has(s.id))
    .map((s) => ({
      studentId: s.id,
      month,
      type: "MONTHLY" as const,
      amount: s.monthlyFee ?? Math.max(0, (s.class?.monthlyFee ?? 0) - s.feeDiscount),
    }))
    .filter((r) => r.amount > 0);

  if (data.length) await db.feeInvoice.createMany({ data });
  revalidatePath("/portal/fees", "layout");
  backTo(back, {
    ok: data.length
      ? `Created ${data.length} monthly fee${data.length === 1 ? "" : "s"} for ${monthLabel(month)}.`
      : `Nothing to create: every student with a monthly fee already has one for ${monthLabel(month)}.`,
  });
}

export type AddFeeState =
  | { error?: string; key: number; ok?: { message: string; receiptId?: string } }
  | undefined;

const fail = (error: string): AddFeeState => ({ error, key: Date.now() });

const addFeeSchema = z
  .object({
    type: z.enum(FEE_TYPES, { error: "Choose the fee type" }),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose the month"),
    studentId: z.string().min(1, "Choose a student"),
    amount: z.coerce.number().int("Fee must be a whole number").positive("Enter the fee amount"),
    paid: z.coerce.number().int("Amount received must be a whole number").min(0, "Amount received cannot be negative"),
    method: z.enum(PAYMENT_METHODS),
  })
  .refine((v) => v.paid <= v.amount, { message: "Amount received cannot be more than the fee", path: ["paid"] });

/** Add a fee for one student and, if money was received, record the payment too. */
export async function addFee(_prev: AddFeeState, formData: FormData): Promise<AddFeeState> {
  const actor = await requireRole(FINANCE_ROLES);

  const parsed = addFeeSchema.safeParse({
    type: text(formData, "type"),
    month: text(formData, "month"),
    studentId: text(formData, "studentId"),
    amount: text(formData, "amount"),
    paid: text(formData, "paid") || "0",
    method: text(formData, "method") || "Cash",
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0].message);
  }
  const v = parsed.data;

  const student = await db.student.findUnique({
    where: { id: v.studentId },
    select: { user: { select: { name: true, isActive: true } } },
  });
  if (!student || !student.user.isActive) return fail("That student was not found.");

  const clash = await db.feeInvoice.findFirst({
    where: { studentId: v.studentId, month: v.month, type: v.type },
    select: { id: true },
  });
  if (clash) {
    return fail(
      `${FEE_TYPE_LABELS[v.type]} already exists for ${student.user.name} in ${monthLabel(v.month)}. Open View fees to receive the rest.`,
    );
  }

  const invoice = await db.feeInvoice.create({
    data: {
      studentId: v.studentId,
      month: v.month,
      type: v.type,
      amount: v.amount,
      note: optionalText(formData, "note"),
      ...(v.paid > 0
        ? { payments: { create: { amount: v.paid, method: v.method, receivedById: actor.id } } }
        : {}),
    },
    select: { payments: { select: { id: true } } },
  });

  revalidatePath("/portal/fees", "layout");
  const due = v.amount - v.paid;
  return {
    key: Date.now(),
    ok: {
      receiptId: invoice.payments[0]?.id,
      message: `${FEE_TYPE_LABELS[v.type]} for ${student.user.name} (${monthLabel(v.month)}) added. ${
        due === 0 ? "Fully paid." : `${pkr(v.paid)} received, ${pkr(due)} still due.`
      }`,
    },
  };
}

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().int("Enter a whole number").positive("Enter an amount above zero"),
  method: z.enum(PAYMENT_METHODS),
});

/** Record a payment against a fee and return to the list with a confirmation. */
export async function recordPayment(formData: FormData) {
  const actor = await requireRole(FINANCE_ROLES);
  const back = text(formData, "back");

  const parsed = paymentSchema.safeParse({
    invoiceId: text(formData, "invoiceId"),
    amount: text(formData, "amount"),
    method: text(formData, "method"),
  });
  if (!parsed.success) backTo(back, { error: parsed.error.issues[0].message });

  const { invoiceId, amount, method } = parsed.data;
  const invoice = await db.feeInvoice.findUnique({
    where: { id: invoiceId },
    select: { amount: true, payments: { select: { amount: true } } },
  });
  if (!invoice) backTo(back, { error: "That fee was not found." });

  const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  if (amount > invoice.amount - paid) backTo(back, { error: "That is more than the balance due." });

  const payment = await db.feePayment.create({
    data: { invoiceId, amount, method, note: optionalText(formData, "note"), receivedById: actor.id },
    select: { id: true },
  });

  revalidatePath("/portal/fees", "layout");
  backTo(back, { ok: `${pkr(amount)} received.`, receipt: payment.id });
}

/** Delete a fee (and any payments recorded against it). Administrators only. */
export async function deleteFee(formData: FormData) {
  await requireRole(USER_ADMIN_ROLES);
  const back = text(formData, "back");
  const id = text(formData, "invoiceId");
  const inv = await db.feeInvoice.findUnique({ where: { id }, select: { id: true } });
  if (!inv) backTo(back, { error: "That fee was not found." });
  await db.$transaction([db.feePayment.deleteMany({ where: { invoiceId: id } }), db.feeInvoice.delete({ where: { id } })]);
  revalidatePath("/portal/fees", "layout");
  backTo(back, { ok: "Fee deleted." });
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
  redirect("/portal/fees/structure?ok=Fees+saved.");
}

/** Save the monthly fee for each student. A blank box means "use the class fee". */
export async function saveStudentFees(formData: FormData) {
  await requireRole(FINANCE_ROLES);
  const classId = text(formData, "classId");
  const students = await db.student.findMany({
    where: { classId, user: { isActive: true } },
    select: { id: true },
  });
  const updates = [];
  for (const st of students) {
    const raw = text(formData, `sf_${st.id}`);
    if (raw === "") {
      updates.push(db.student.update({ where: { id: st.id }, data: { monthlyFee: null } }));
      continue;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 1_000_000) continue;
    updates.push(db.student.update({ where: { id: st.id }, data: { monthlyFee: n } }));
  }
  await db.$transaction(updates);
  revalidatePath("/portal/fees", "layout");
  redirect(`/portal/fees/structure?classId=${encodeURIComponent(classId)}&ok=Student+fees+saved.`);
}
