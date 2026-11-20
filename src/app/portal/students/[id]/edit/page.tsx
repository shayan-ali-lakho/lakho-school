import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { ActionForm } from "@/components/action-form";
import { Card, Field, SelectField } from "@/components/fields";
import { updateStudent } from "../../actions";
import { ProfilePictureEditor } from "@/components/portal/profile-picture-editor";

export const metadata: Metadata = { title: "Edit student" };

export default async function EditStudentPage(props: PageProps<"/portal/students/[id]/edit">) {
  await requireRole(USER_ADMIN_ROLES);
  const { id } = await props.params;

  const [student, classes] = await Promise.all([
    db.student.findUnique({
      where: { id },
      select: {
        userId:true,
        photoData:true,
        rollNumber: true,
        classId: true,
        gender: true,
        address: true,
        monthlyFee: true,
        dateOfBirth: true,
        user: { select: { name: true, photoData:true } },
      },
    }),
    db.class.findMany({
      orderBy: [{ academicYear: "desc" }, { name: "asc" }, { section: "asc" }],
      select: { id: true, name: true, section: true, academicYear: true },
    }),
  ]);
  if (!student) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href={`/portal/students/${id}`} className="text-sm text-brand-700 hover:underline">
          ← {student.user.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit student</h1>
      </div>
      <ProfilePictureEditor userId={student.userId} name={student.user.name} photoData={student.user.photoData??student.photoData}/>
      <Card>
        <ActionForm action={updateStudent} submitLabel="Save changes">
          <input type="hidden" name="id" value={id} />
          <Field label="Full name" name="name" required defaultValue={student.user.name} />
          <SelectField
            label="Class"
            name="classId"
            required
            defaultValue={student.classId ?? ""}
            placeholder="Choose a class"
            options={classes.map((c) => ({ value: c.id, label: `${c.name} ${c.section} (${c.academicYear})` }))}
          />
          <Field label="Roll number" name="rollNumber" required defaultValue={student.rollNumber} />
          <Field
            label="Date of birth"
            name="dateOfBirth"
            type="date"
            defaultValue={student.dateOfBirth ? student.dateOfBirth.toISOString().slice(0, 10) : ""}
          />
          <SelectField
            label="Gender"
            name="gender"
            defaultValue={student.gender ?? ""}
            placeholder="Not set"
            options={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Other", label: "Other" },
            ]}
          />
          <Field label="Address" name="address" defaultValue={student.address ?? ""} />
          <Field
            label="Monthly fee (PKR)"
            name="monthlyFee"
            type="number"
            defaultValue={student.monthlyFee === null ? "" : String(student.monthlyFee)}
            hint="Leave empty to charge the class fee. Applies to invoices created from now on."
          />
        </ActionForm>
      </Card>
    </div>
  );
}
