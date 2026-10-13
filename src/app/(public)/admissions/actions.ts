"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { CLASS_OPTIONS } from "@/lib/site";
import { optionalText, text, firstIssue } from "@/lib/form";
import type { PublicFormState } from "@/components/site/public-form";

const phone = z.string().regex(/^[0-9+\-\s()]{10,18}$/, "Enter a valid phone number");

const schema = z.object({
  childName: z.string().min(2, "Enter the child's name").max(100),
  dateOfBirth: z.iso.date("Enter the date of birth").transform((s) => new Date(`${s}T00:00:00Z`)),
  gender: z.enum(["Girl", "Boy"], "Choose girl or boy"),
  classApplied: z.enum(CLASS_OPTIONS as [string, ...string[]], "Choose a class"),
  previousSchool: z.string().max(150).optional(),
  guardianName: z.string().min(2, "Enter the parent or guardian's name").max(100),
  phone,
  email: z.email("Enter a valid email").optional(),
  address: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
});

export async function submitApplication(_prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  // Bots fill the hidden field; pretend it worked.
  if (text(formData, "website") !== "") return { success: "Your application has been received." };

  const parsed = schema.safeParse({
    childName: text(formData, "childName"),
    dateOfBirth: text(formData, "dateOfBirth"),
    gender: text(formData, "gender"),
    classApplied: text(formData, "classApplied"),
    previousSchool: optionalText(formData, "previousSchool"),
    guardianName: text(formData, "guardianName"),
    phone: text(formData, "phone"),
    email: optionalText(formData, "email"),
    address: optionalText(formData, "address"),
    notes: optionalText(formData, "notes"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const age = (Date.now() - parsed.data.dateOfBirth.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (age < 2 || age > 20) return { error: "Please check the date of birth." };

  try {
    await db.admissionApplication.create({ data: parsed.data });
  } catch (error) {
    console.error("Could not save application:", error);
    return { error: "Sorry, we could not save your application. Please try again or call the school office." };
  }
  return { success: "Your application has been received. The school office will contact you on the phone number you gave." };
}
