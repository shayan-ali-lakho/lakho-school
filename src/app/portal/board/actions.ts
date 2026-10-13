"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { optionalText, text } from "@/lib/form";

export async function saveBoardRecord(formData: FormData) {
  await requireRole(USER_ADMIN_ROLES);
  const studentId = text(formData, "studentId");
  const examYear = text(formData, "examYear");
  const back = `/portal/board?year=${encodeURIComponent(examYear)}`;
  if (!/^\d{4}$/.test(examYear)) redirect("/portal/board");

  const data = {
    boardRollNo: optionalText(formData, "boardRollNo") ?? null,
    registrationNo: optionalText(formData, "registrationNo") ?? null,
    groupName: optionalText(formData, "groupName") ?? null,
    result: optionalText(formData, "result") ?? null,
  };
  await db.boardRecord.upsert({
    where: { studentId_examYear: { studentId, examYear } },
    update: data,
    create: { studentId, examYear, ...data },
  });
  revalidatePath("/portal/board");
  redirect(`${back}&saved=${studentId}&ok=Board+record+saved.`);
}
