"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { text } from "@/lib/form";

const STATUSES = ["NEW", "CONTACTED", "ACCEPTED", "DECLINED"] as const;

export async function setApplicationStatus(formData: FormData) {
  await requireRole(USER_ADMIN_ROLES);
  const status = text(formData, "status");
  if (!(STATUSES as readonly string[]).includes(status)) return;
  await db.admissionApplication
    .update({ where: { id: text(formData, "id") }, data: { status: status as (typeof STATUSES)[number] } })
    .catch(() => undefined);
  revalidatePath("/portal", "layout");
}

export async function setMessageHandled(formData: FormData) {
  await requireRole(USER_ADMIN_ROLES);
  await db.contactMessage
    .update({ where: { id: text(formData, "id") }, data: { handled: text(formData, "handled") === "true" } })
    .catch(() => undefined);
  revalidatePath("/portal", "layout");
}
