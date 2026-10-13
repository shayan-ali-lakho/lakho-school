import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { EXAM_KINDS } from "@/lib/academics";
import { ActionForm } from "@/components/action-form";
import { Card, Field, SelectField } from "@/components/fields";
import { createExam } from "../actions";

export const metadata: Metadata = { title: "Create exam" };

export default async function NewExamPage() {
  await requireRole(USER_ADMIN_ROLES);
  const classes = await db.class.findMany({
    orderBy: [{ academicYear: "desc" }, { name: "asc" }, { section: "asc" }],
    select: { id: true, name: true, section: true, academicYear: true },
  });

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/portal/exams" className="text-sm text-emerald-700 hover:underline">← Exams</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create exam</h1>
        <p className="mt-1 text-sm text-zinc-600">One exam covers every subject of one class. Marks are entered per subject afterwards.</p>
      </div>
      <Card>
        <ActionForm action={createExam} submitLabel="Create exam">
          <Field label="Exam name" name="name" required placeholder="e.g. October monthly test" />
          <SelectField label="Type" name="kind" required placeholder="Choose a type" options={EXAM_KINDS.map((k) => ({ value: k, label: k }))} />
          <SelectField
            label="Class"
            name="classId"
            required
            placeholder="Choose a class"
            options={classes.map((c) => ({ value: c.id, label: `${c.name} ${c.section} (${c.academicYear})` }))}
          />
          <Field label="Exam date" name="examDate" type="date" />
          <Field label="Total marks per subject" name="totalMarks" type="number" defaultValue="100" required />
          <Field label="Pass mark (%)" name="passPercent" type="number" defaultValue="33" required hint="Below this percentage in a subject is a fail." />
        </ActionForm>
      </Card>
    </div>
  );
}
