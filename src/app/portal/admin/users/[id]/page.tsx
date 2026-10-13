import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ROLE_LABELS, USER_ADMIN_ROLES } from "@/lib/roles";
import { loginName } from "@/lib/accounts";
import { ActionForm } from "@/components/action-form";
import { Card, Field } from "@/components/fields";
import { LoginTools } from "@/components/portal/login-tools";
import { updateUser } from "../actions";

export const metadata: Metadata = { title: "Edit account" };

export default async function EditUserPage(props: PageProps<"/portal/admin/users/[id]">) {
  await requireRole(USER_ADMIN_ROLES);
  const { id } = await props.params;

  const user = await db.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true } });
  if (!user) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/portal/admin/users" className="text-sm text-emerald-700 hover:underline">
          ← Logins and roles
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit account</h1>
        <p className="mt-1 text-sm text-zinc-600">{ROLE_LABELS[user.role]}</p>
      </div>
      <Card title="Name and username">
        <ActionForm action={updateUser} submitLabel="Save changes">
          <input type="hidden" name="userId" value={user.id} />
          <Field label="Full name" name="name" required defaultValue={user.name} />
          <Field
            label="Username or email (used to sign in)"
            name="email"
            required
            defaultValue={loginName(user.email)}
            autoComplete="off"
            hint="Changing this changes what the person types to sign in."
          />
        </ActionForm>
      </Card>
      <Card title="Password">
        <LoginTools userId={user.id} email={loginName(user.email)} />
        <p className="mt-4 text-sm text-zinc-600">
          Or{" "}
          <Link href={`/portal/admin/users/${user.id}/password`} className="text-emerald-700 hover:underline">
            type a password yourself
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
