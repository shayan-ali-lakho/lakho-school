"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { firstIssue, optionalText, text } from "@/lib/form";
import type { PublicFormState } from "@/components/site/public-form";

const schema = z
  .object({
    name: z.string().min(2, "Enter your name").max(100),
    phone: z.string().regex(/^[0-9+\-\s()]{10,18}$/, "Enter a valid phone number").optional(),
    email: z.email("Enter a valid email").optional(),
    message: z.string().min(5, "Write a short message").max(2000),
  })
  .refine((v) => v.phone || v.email, { message: "Give a phone number or an email so we can reply", path: ["phone"] });

export async function sendMessage(_prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  if (text(formData, "website") !== "") return { success: "Your message has been sent." };

  const parsed = schema.safeParse({
    name: text(formData, "name"),
    phone: optionalText(formData, "phone"),
    email: optionalText(formData, "email"),
    message: text(formData, "message"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  try {
    await db.contactMessage.create({ data: parsed.data });
  } catch (error) {
    console.error("Could not save message:", error);
    return { error: "Sorry, your message could not be sent. Please call the school office instead." };
  }
  return { success: "Your message has been sent. We will reply as soon as we can." };
}
