import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { ActionForm } from "@/components/action-form";
import { Card, Field } from "@/components/fields";
import { resetPassword } from "../../actions";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage(props: PageProps<"/portal/admin/users/[id]/password">) {
  await requireRole(USER_ADMIN_ROLES);
  const { id } = await props.params;

  const user = await db.user.findUnique({ where: { id }, select: { id: true, name: true, email: true } });
  if (!user) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/portal/admin/users" className="text-sm text-emerald-700 hover:underline">
          ← Users
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {user.name} ({user.email})
        </p>
      </div>
      <Card>
        <ActionForm action={resetPassword} submitLabel="Set new password">
          <input type="hidden" name="userId" value={user.id} />
          <Field
            label="New temporary password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            hint="At least 8 characters."
          />
        </ActionForm>
      </Card>
    </div>
  );
}
