import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/session";
import { ROLE_LABELS, ROLES, USER_ADMIN_ROLES } from "@/lib/roles";
import { ActionForm } from "@/components/action-form";
import { Card, Field, SelectField } from "@/components/fields";
import { createUser } from "../actions";

export const metadata: Metadata = { title: "New user" };

export default async function NewUserPage() {
  const actor = await requireRole(USER_ADMIN_ROLES);

  // Principals cannot create admin or principal accounts (also enforced in the action).
  const roles = ROLES.filter((r) => actor.role === "ADMIN" || (r !== "ADMIN" && r !== "PRINCIPAL"));

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/portal/admin/users" className="text-sm text-emerald-700 hover:underline">
          ← Users
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New user</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Teacher, student and parent profiles are created from their own screens. Use this for
          staff accounts such as accountants.
        </p>
      </div>
      <Card>
        <ActionForm action={createUser} submitLabel="Create user">
          <Field label="Full name" name="name" required />
          <Field label="Email (used to sign in)" name="email" type="email" required autoComplete="off" />
          <SelectField
            label="Role"
            name="role"
            required
            placeholder="Choose a role"
            options={roles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          />
          <Field
            label="Temporary password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            hint="At least 8 characters. Share it with the user securely."
          />
        </ActionForm>
      </Card>
    </div>
  );
}
