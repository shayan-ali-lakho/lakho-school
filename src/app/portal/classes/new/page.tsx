import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { ActionForm } from "@/components/action-form";
import { Card, Field, SelectField } from "@/components/fields";
import { createClass } from "../actions";

export const metadata: Metadata = { title: "New class" };

export default async function NewClassPage() {
  await requireRole(USER_ADMIN_ROLES);

  const teachers = await db.teacher.findMany({
    orderBy: { user: { name: "asc" } },
    select: { id: true, user: { select: { name: true } } },
  });

  const year = new Date().getFullYear();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/portal/classes" className="text-sm text-emerald-700 hover:underline">
          ← Classes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New class</h1>
      </div>
      <Card>
        <ActionForm action={createClass} submitLabel="Create class">
          <Field label="Class name" name="name" required placeholder="e.g. Class 5" />
          <Field label="Section" name="section" required defaultValue="A" />
          <Field
            label="Academic year"
            name="academicYear"
            required
            defaultValue={`${year}-${year + 1}`}
            hint="Format: 2026-2027"
          />
          <SelectField
            label="Class teacher"
            name="classTeacherId"
            placeholder="Not assigned yet"
            options={teachers.map((t) => ({ value: t.id, label: t.user.name }))}
            hint="Add teachers first under Teachers."
          />
        </ActionForm>
      </Card>
    </div>
  );
}
