import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/session";
import { ROLE_LABELS, USER_ADMIN_ROLES, type AppRole } from "@/lib/roles";
import { Card } from "@/components/fields";
import { NewUserForm } from "@/components/portal/new-user-form";

export const metadata: Metadata = { title: "New account" };

const CREATABLE: AppRole[] = ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER", "PARENT"];

export default async function NewUserPage() {
  const actor = await requireRole(USER_ADMIN_ROLES);

  // Principals cannot create admin or principal accounts (also enforced in the action).
  const roles = CREATABLE.filter((r) => actor.role === "ADMIN" || (r !== "ADMIN" && r !== "PRINCIPAL")).map((r) => ({
    value: r,
    label: ROLE_LABELS[r],
  }));

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/portal/admin/users" className="text-sm text-emerald-700 hover:underline">
          ← Logins and roles
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New account</h1>
        <p className="mt-1 text-sm text-zinc-600">
          For administrators, principals, accountants, teachers and parents. To create a student account, admit the
          student from the{" "}
          <Link href="/portal/students/new" className="text-emerald-700 hover:underline">
            Students page
          </Link>
          .
        </p>
      </div>
      <Card>
        <NewUserForm roles={roles} />
      </Card>
    </div>
  );
}
