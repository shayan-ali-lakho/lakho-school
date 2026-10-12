import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAFF_ROLES } from "@/lib/roles";

export const metadata: Metadata = { title: "Class" };

export default async function ClassDetailPage(props: PageProps<"/portal/classes/[id]">) {
  await requireRole(STAFF_ROLES);
  const { id } = await props.params;

  const cls = await db.class.findUnique({
    where: { id },
    select: {
      name: true,
      section: true,
      academicYear: true,
      classTeacher: { select: { user: { select: { name: true } } } },
      students: {
        orderBy: { rollNumber: "asc" },
        select: {
          id: true,
          rollNumber: true,
          user: { select: { name: true } },
          guardian: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });
  if (!cls) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal/classes" className="text-sm text-emerald-700 hover:underline">
          ← Classes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {cls.name} {cls.section}
        </h1>
        <p className="mt-1 text-zinc-600">
          {cls.academicYear} · Class teacher: {cls.classTeacher?.user.name ?? "not assigned"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Roll no.</th>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Parent / guardian</th>
            </tr>
          </thead>
          <tbody>
            {cls.students.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">
                  No students in this class yet.
                </td>
              </tr>
            )}
            {cls.students.map((s) => (
              <tr key={s.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3">{s.rollNumber}</td>
                <td className="px-4 py-3">
                  <Link href={`/portal/students/${s.id}`} className="text-emerald-700 hover:underline">
                    {s.user.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600">{s.guardian?.user.name ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
