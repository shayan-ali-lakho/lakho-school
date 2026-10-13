import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { ROLES, type AppRole } from "@/lib/roles";

export const passwordSchema = z
  .string()
  .min(8, "must be at least 8 characters")
  .max(72, "must be at most 72 characters"); // bcrypt only uses the first 72 bytes

/** Accounts created with a plain username get this made-up email domain behind the scenes. */
export const LOCAL_DOMAIN = "school.local";

/**
 * A login name typed by an admin: either a real email address or a plain username
 * (3-30 letters, numbers, dots, dashes, underscores). Returns the value stored in User.email.
 */
export const loginIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "is required")
  .transform((v, ctx) => {
    if (v.includes("@")) {
      if (!z.email().safeParse(v).success) {
        ctx.addIssue({ code: "custom", message: "must be a valid email or a username" });
        return z.NEVER;
      }
      return v;
    }
    if (!/^[a-z0-9._-]{3,30}$/.test(v)) {
      ctx.addIssue({
        code: "custom",
        message: "username must be 3-30 letters, numbers, dots, dashes or underscores",
      });
      return z.NEVER;
    }
    return `${v}@${LOCAL_DOMAIN}`;
  });

/** What to show people: the username for made-up addresses, the email otherwise. */
export function loginName(email: string): string {
  return email.endsWith(`@${LOCAL_DOMAIN}`) ? email.slice(0, -(LOCAL_DOMAIN.length + 1)) : email;
}

/** Turn what someone typed on the sign-in form into the stored login address. */
export function loginToEmail(input: string): string {
  const v = input.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${LOCAL_DOMAIN}`;
}

export const accountSchema = z.object({
  name: z.string().trim().min(2, "is required").max(100),
  email: loginIdSchema,
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
