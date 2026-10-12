import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { STAFF_ROLES } from "@/lib/roles";

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
    ["Status", student.user.isActive ? "Active" : "Disabled"],
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        {isStaff && (
          <Link href="/portal/students" className="text-sm text-emerald-700 hover:underline">
            ← Students
          </Link>
        )}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{student.user.name}</h1>
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
    </div>
  );
}
