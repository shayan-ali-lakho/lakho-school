import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { ActionForm } from "@/components/action-form";
import { Card, Field } from "@/components/fields";
import { createTeacher } from "../actions";

export const metadata: Metadata = { title: "Add teacher" };

export default async function NewTeacherPage() {
  await requireRole(USER_ADMIN_ROLES);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/portal/teachers" className="text-sm text-emerald-700 hover:underline">
          ← Teachers
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Add teacher</h1>
      </div>
      <Card>
        <ActionForm action={createTeacher} submitLabel="Add teacher">
          <Field label="Full name" name="name" required />
          <Field label="Username or email (used to sign in)" name="email" required autoComplete="off" hint="e.g. m.ahmed or ahmed@example.com" />
          <Field
            label="Temporary password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            hint="At least 8 characters."
          />
          <Field label="Employee ID" name="employeeId" />
          <Field label="Phone" name="phone" type="tel" />
          <Field label="Qualification" name="qualification" placeholder="e.g. M.Sc. Mathematics" />
          <Field label="Position" name="position" placeholder="e.g. Senior Teacher, Head of Science" />
          <Field
            label="Monthly base salary (PKR)"
            name="baseSalary"
            type="number"
            defaultValue="0"
            hint="Monthly bonuses and deductions are added later, when salaries are processed."
          />
        </ActionForm>
      </Card>
    </div>
  );
}
