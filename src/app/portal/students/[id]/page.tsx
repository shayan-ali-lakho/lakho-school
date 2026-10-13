import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { STAFF_ROLES, USER_ADMIN_ROLES } from "@/lib/roles";
import { LoginTools } from "@/components/portal/login-tools";
import { setUserActive } from "../../admin/users/actions";

export const metadata: Metadata = { title: "Student" };

export default async function StudentProfilePage(props: PageProps<"/portal/students/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;

  const student = await db.student.findUnique({
    where: { id },
    select: {
      rollNumber: true,
      gender: true,
      address: true,
      dateOfBirth: true,
      admittedOn: true,
      userId: true,
      user: { select: { name: true, email: true, isActive: true } },
      class: { select: { id: true, name: true, section: true, academicYear: true } },
      guardian: { select: { userId: true, phone: true, user: { select: { name: true, email: true } } } },
    },
  });
  if (!student) notFound();

  // Staff can open any profile. A student may open their own, and a parent their child's.
  const isStaff = STAFF_ROLES.includes(user.role);
  const canManage = USER_ADMIN_ROLES.includes(user.role);
  const isSelf = user.role === "STUDENT" && student.userId === user.id;
  const isParent = user.role === "PARENT" && student.guardian?.userId === user.id;
  if (!isStaff && !isSelf && !isParent) redirect("/portal");

  const rows: [string, string][] = [
    ["Roll number", student.rollNumber],
    ["Class", student.class ? `${student.class.name} ${student.class.section} (${student.class.academicYear})` : "-"],
    ["Email", student.user.email],
    ["Date of birth", student.dateOfBirth ? student.dateOfBirth.toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" }) : "-"],
    ["Gender", student.gender ?? "-"],
    ["Address", student.address ?? "-"],
    ["Admitted on", student.admittedOn.toLocaleDateString("en-GB", { dateStyle: "medium" })],
    ["Status", student.user.isActive ? "Active" : "Removed (cannot sign in)"],
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        {isStaff && (
          <Link href="/portal/students" className="text-sm text-emerald-700 hover:underline">
            ← Students
          </Link>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{student.user.name}</h1>
          {canManage && (
            <Link
              href={`/portal/students/${id}/edit`}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
            >
              Edit details
            </Link>
          )}
        </div>
      </div>

      <dl className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
            <dt className="text-zinc-500">{label}</dt>
            <dd className="col-span-2">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <h2 className="font-medium">Parent / guardian</h2>
        {student.guardian ? (
          <p className="mt-2 text-zinc-700">
            {student.guardian.user.name} · {student.guardian.user.email}
            {student.guardian.phone ? ` · ${student.guardian.phone}` : ""}
          </p>
        ) : (
          <p className="mt-2 text-zinc-500">No parent linked yet.</p>
        )}
      </section>

      {canManage && (
        <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-medium">Login and access</h2>
          <LoginTools userId={student.userId} email={student.user.email} />
          <form action={setUserActive} className="border-t border-zinc-100 pt-4">
            <input type="hidden" name="userId" value={student.userId} />
            <input type="hidden" name="active" value={String(!student.user.isActive)} />
            <button
              type="submit"
              className={`rounded-md border px-3 py-1.5 text-sm ${
                student.user.isActive
                  ? "border-red-300 text-red-700 hover:bg-red-50"
                  : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {student.user.isActive ? "Remove student from school" : "Restore student"}
            </button>
            <p className="mt-2 text-xs text-zinc-500">
              {student.user.isActive
                ? "Removing blocks sign-in and hides the student from lists. Records are kept and the student can be restored."
                : "This student is removed. Restoring lets them sign in again."}
            </p>
          </form>
        </section>
      )}
    </div>
  );
}
