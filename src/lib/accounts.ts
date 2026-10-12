import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { ROLES, type AppRole } from "@/lib/roles";

export const passwordSchema = z
  .string()
  .min(8, "must be at least 8 characters")
  .max(72, "must be at most 72 characters"); // bcrypt only uses the first 72 bytes

export const accountSchema = z.object({
  name: z.string().trim().min(2, "is required").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("must be a valid email")),
  role: z.enum(ROLES),
  password: passwordSchema,
});

export type NewAccount = z.infer<typeof accountSchema>;

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`An account with the email ${email} already exists.`);
  }
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

/** Throws DuplicateEmailError when the email already has an account. */
export async function assertEmailFree(email: string) {
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new DuplicateEmailError(email);
}

/** Create a login account. Throws DuplicateEmailError when the email is taken. */
export async function createAccount(input: NewAccount & { role: AppRole }) {
  await assertEmailFree(input.email);

  return db.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: await hashPassword(input.password),
    },
  });
}
