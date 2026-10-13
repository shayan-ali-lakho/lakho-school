"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { firstIssue, text, type FormState } from "@/lib/form";

const AUDIENCES = ["TEACHER", "ACCOUNTANT", "STUDENT", "PARENT"] as const;

const schema = z.object({
  title: z.string().trim().min(3, "Enter a title").max(150),
  body: z.string().trim().min(3, "Write the announcement").max(5000),
});

export async function postAnnouncement(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole(["ADMIN"]);

  const parsed = schema.safeParse({ title: text(formData, "title"), body: text(formData, "body") });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const picked = formData.getAll("audience").filter((a): a is (typeof AUDIENCES)[number] =>
    (AUDIENCES as readonly string[]).includes(String(a)),
  );
  // Only the administrator posts announcements.
  const audience = picked;
  const isPublic = formData.get("isPublic") === "on";

  if (audience.length === 0 && !isPublic) return { error: "Choose who should see this announcement." };

  await db.announcement.create({
    data: { ...parsed.data, audience, isPublic, authorId: user.id },
  });
  revalidatePath("/portal", "layout");
  revalidatePath("/news");
  revalidatePath("/");
  redirect("/portal/announcements?ok=Announcement+posted.");
}

export async function deleteAnnouncement(formData: FormData) {
  await requireRole(["ADMIN"]);
  const id = text(formData, "id");
  const a = await db.announcement.findUnique({ where: { id }, select: { id: true } });
  if (a) {
    await db.announcement.delete({ where: { id } });
  }
  revalidatePath("/portal", "layout");
  revalidatePath("/news");
  revalidatePath("/");
  redirect("/portal/announcements?ok=Announcement+deleted.");
}
