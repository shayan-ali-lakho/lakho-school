import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAFF_ROLES, USER_ADMIN_ROLES } from "@/lib/roles";

export const metadata: Metadata = { title: "Students" };

export default async function StudentsPage(props: PageProps<"/portal/students">) {
  const user = await requireRole(STAFF_ROLES);
  const canManage = USER_ADMIN_ROLES.includes(user.role);

  const { classId } = await props.searchParams;
  const selectedClass = typeof classId === "string" && classId ? classId : undefined;

  const [classes, students] = await Promise.all([
    db.class.findMany({
      orderBy: [{ academicYear: "desc" }, { name: "asc" }, { section: "asc" }],
      select: { id: true, name: true, section: true, academicYear: true },
    }),
    db.student.findMany({
      where: selectedClass ? { classId: selectedClass } : {},
      orderBy: [{ class: { name: "asc" } }, { rollNumber: "asc" }],
      take: 300,
      select: {
        id: true,
        rollNumber: true,
        user: { select: { name: true, isActive: true } },
        class: { select: { name: true, section: true } },
        guardian: { select: { user: { select: { name: true } } } },
      },
    }),
  ]);

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
          <p className="mt-1 text-zinc-600">{students.length} students</p>
        </div>
        {canManage && (
          <Link
            href="/portal/students/new"
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Admit student
          </Link>
        )}
      </div>

      <form method="get" className="mt-4 flex items-center gap-2 text-sm">
        <label htmlFor="classId" className="text-zinc-600">
          Class
        </label>
        <select
          id="classId"
          name="classId"
          defaultValue={selectedClass ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.section} ({c.academicYear})
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100">
          Filter
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Roll no.</th>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">Parent / guardian</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  No students found.
                </td>
              </tr>
            )}
            {students.map((s) => (
              <tr key={s.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3">{s.rollNumber}</td>
                <td className="px-4 py-3">
                  <Link href={`/portal/students/${s.id}`} className="text-emerald-700 hover:underline">
                    {s.user.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{s.class ? `${s.class.name} ${s.class.section}` : "-"}</td>
                <td className="px-4 py-3 text-zinc-600">{s.guardian?.user.name ?? "-"}</td>
                <td className="px-4 py-3">{s.user.isActive ? "Active" : "Disabled"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
