import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { ActionForm } from "@/components/action-form";
import { Card, Field } from "@/components/fields";
import { LoginTools } from "@/components/portal/login-tools";
import { updateTeacher } from "../../actions";

export const metadata: Metadata = { title: "Edit teacher" };

export default async function EditTeacherPage(props: PageProps<"/portal/teachers/[id]/edit">) {
  await requireRole(USER_ADMIN_ROLES);
  const { id } = await props.params;

  const teacher = await db.teacher.findUnique({
    where: { id },
    select: {
      userId: true,
      employeeId: true,
      phone: true,
      qualification: true,
      position: true,
      baseSalary: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!teacher) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/portal/teachers" className="text-sm text-emerald-700 hover:underline">
          ← Teachers
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit teacher</h1>
        <p className="mt-1 text-sm text-zinc-600">{teacher.user.email}</p>
      </div>
      <Card>
        <ActionForm action={updateTeacher} submitLabel="Save changes">
          <input type="hidden" name="id" value={id} />
          <Field label="Full name" name="name" required defaultValue={teacher.user.name} />
          <Field label="Employee ID" name="employeeId" defaultValue={teacher.employeeId ?? ""} />
          <Field label="Phone" name="phone" type="tel" defaultValue={teacher.phone ?? ""} />
          <Field label="Qualification" name="qualification" defaultValue={teacher.qualification ?? ""} />
          <Field label="Position" name="position" defaultValue={teacher.position ?? ""} />
          <Field
            label="Monthly base salary (PKR)"
            name="baseSalary"
            type="number"
            defaultValue={String(teacher.baseSalary)}
          />
        </ActionForm>
      </Card>
      <Card title="Login">
        <LoginTools userId={teacher.userId} email={teacher.user.email} />
      </Card>
    </div>
  );
}
