import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAFF_ROLES, USER_ADMIN_ROLES } from "@/lib/roles";

export const metadata: Metadata = { title: "Classes" };

export default async function ClassesPage() {
  const user = await requireRole(STAFF_ROLES);
  const canManage = USER_ADMIN_ROLES.includes(user.role);

  const classes = await db.class.findMany({
    orderBy: [{ academicYear: "desc" }, { name: "asc" }, { section: "asc" }],
    select: {
      id: true,
      name: true,
      section: true,
      academicYear: true,
      classTeacher: { select: { user: { select: { name: true } } } },
      _count: { select: { students: true } },
    },
  });

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
          <p className="mt-1 text-zinc-600">{classes.length} classes</p>
        </div>
        {canManage && (
          <Link
            href="/portal/classes/new"
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            New class
          </Link>
        )}
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">Section</th>
              <th className="px-4 py-3 font-medium">Year</th>
              <th className="px-4 py-3 font-medium">Class teacher</th>
              <th className="px-4 py-3 font-medium">Students</th>
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  No classes yet.
                </td>
              </tr>
            )}
            {classes.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/portal/classes/${c.id}`} className="text-emerald-700 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.section}</td>
                <td className="px-4 py-3 text-zinc-600">{c.academicYear}</td>
                <td className="px-4 py-3">{c.classTeacher?.user.name ?? "-"}</td>
                <td className="px-4 py-3">{c._count.students}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
