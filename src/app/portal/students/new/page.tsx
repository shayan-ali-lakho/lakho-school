import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { ActionForm } from "@/components/action-form";
import { Card, Field, SelectField } from "@/components/fields";
import { admitStudent } from "../actions";

export const metadata: Metadata = { title: "Admit student" };

export default async function AdmitStudentPage() {
  await requireRole(USER_ADMIN_ROLES);

  const [classes, guardians] = await Promise.all([
    db.class.findMany({
      orderBy: [{ academicYear: "desc" }, { name: "asc" }, { section: "asc" }],
      select: { id: true, name: true, section: true, academicYear: true },
    }),
    db.guardian.findMany({
      orderBy: { user: { name: "asc" } },
      select: { id: true, user: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/portal/students" className="text-sm text-emerald-700 hover:underline">
          ← Students
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Admit student</h1>
        {classes.length === 0 && (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Create a class first, then come back to admit students.
          </p>
        )}
      </div>

      <ActionForm action={admitStudent} submitLabel="Admit student">
        <Card title="Student">
          <div className="space-y-4">
            <Field label="Full name" name="name" required />
            <Field label="Email (used to sign in)" name="email" type="email" required autoComplete="off" />
            <Field
              label="Temporary password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              hint="At least 8 characters."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Class"
                name="classId"
                required
                placeholder="Choose a class"
                options={classes.map((c) => ({
                  value: c.id,
                  label: `${c.name} ${c.section} (${c.academicYear})`,
                }))}
              />
              <Field label="Roll number" name="rollNumber" required />
              <Field label="Date of birth" name="dateOfBirth" type="date" />
              <SelectField
                label="Gender"
                name="gender"
                placeholder="Not specified"
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                  { value: "Other", label: "Other" },
                ]}
              />
            </div>
            <Field label="Address" name="address" />
          </div>
        </Card>

        <Card title="Parent / guardian (optional)">
          <div className="space-y-4">
            <SelectField
              label="Existing parent"
              name="guardianId"
              placeholder="None / create a new parent below"
              options={guardians.map((g) => ({
                value: g.id,
                label: `${g.user.name} (${g.user.email})`,
              }))}
              hint="Pick a parent who already has an account (for example, for a second child)."
            />
            <p className="text-sm text-zinc-500">
              Or create a new parent account. Leave these blank if you chose an existing parent above.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Parent name" name="guardianName" />
              <Field label="Parent email" name="guardianEmail" type="email" autoComplete="off" />
              <Field label="Parent phone" name="guardianPhone" type="tel" />
              <Field
                label="Parent temporary password"
                name="guardianPassword"
                type="password"
                autoComplete="new-password"
              />
            </div>
          </div>
        </Card>
      </ActionForm>
    </div>
  );
}
