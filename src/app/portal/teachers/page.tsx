import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";

export const metadata: Metadata = { title: "Teachers" };

export default async function TeachersPage() {
  await requireRole(USER_ADMIN_ROLES);

  const teachers = await db.teacher.findMany({
    orderBy: { user: { name: "asc" } },
    select: {
      id: true,
      employeeId: true,
      phone: true,
      qualification: true,
      user: { select: { name: true, email: true, isActive: true } },
      classesLed: { select: { id: true, name: true, section: true } },
    },
  });

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teachers</h1>
          <p className="mt-1 text-zinc-600">{teachers.length} teachers</p>
        </div>
        <Link
          href="/portal/teachers/new"
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Add teacher
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Employee ID</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Class teacher of</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  No teachers yet.
                </td>
              </tr>
            )}
            {teachers.map((t) => (
              <tr key={t.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3">
                  <div>{t.user.name}</div>
                  {t.qualification && <div className="text-xs text-zinc-500">{t.qualification}</div>}
                </td>
                <td className="px-4 py-3 text-zinc-600">{t.employeeId ?? "-"}</td>
                <td className="px-4 py-3 text-zinc-600">
                  <div>{t.user.email}</div>
                  {t.phone && <div className="text-xs">{t.phone}</div>}
                </td>
                <td className="px-4 py-3">
                  {t.classesLed.length === 0
                    ? "-"
                    : t.classesLed.map((c) => (
                        <Link
                          key={c.id}
                          href={`/portal/classes/${c.id}`}
                          className="mr-2 text-emerald-700 hover:underline"
                        >
                          {c.name} {c.section}
                        </Link>
                      ))}
                </td>
                <td className="px-4 py-3">{t.user.isActive ? "Active" : "Disabled"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
