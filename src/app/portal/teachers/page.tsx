import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { loginName } from "@/lib/accounts";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { setUserActive } from "../admin/users/actions";

export const metadata: Metadata = { title: "Teachers" };

const pkr = new Intl.NumberFormat("en-PK");

export default async function TeachersPage(props: PageProps<"/portal/teachers">) {
  await requireRole(USER_ADMIN_ROLES);
  const { removed } = await props.searchParams;
  const showRemoved = removed === "1";

  const teachers = await db.teacher.findMany({
    where: { user: { isActive: !showRemoved } },
    orderBy: { user: { name: "asc" } },
    select: {
      id: true,
      userId: true,
      employeeId: true,
      phone: true,
      qualification: true,
      position: true,
      baseSalary: true,
      user: { select: { name: true, email: true, isActive: true } },
      classesLed: { select: { id: true, name: true, section: true } },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teachers</h1>
          <p className="mt-1 text-zinc-600">
            {teachers.length} {showRemoved ? "removed teachers" : "teachers"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={showRemoved ? "/portal/teachers" : "/portal/teachers?removed=1"}
            className="text-sm text-emerald-700 hover:underline"
          >
            {showRemoved ? "Show current teachers" : "Show removed"}
          </Link>
          <Link
            href="/portal/teachers/new"
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Add teacher
          </Link>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Position</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Class teacher of</th>
              <th className="px-4 py-3 text-right font-medium">Base salary (PKR)</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  No teachers here.
                </td>
              </tr>
            )}
            {teachers.map((t) => (
              <tr key={t.id} className="border-b border-zinc-100 align-top last:border-0">
                <td className="px-4 py-3">
                  <div>{t.user.name}</div>
                  <div className="text-xs text-zinc-500">
                    {[t.employeeId, t.qualification].filter(Boolean).join(" · ")}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600">{t.position ?? "-"}</td>
                <td className="px-4 py-3 text-zinc-600">
                  <div>{loginName(t.user.email)}</div>
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
                <td className="px-4 py-3 text-right tabular-nums">{pkr.format(t.baseSalary)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Link href={`/portal/teachers/${t.id}/edit`} className="mr-4 text-emerald-700 hover:underline">
                    Edit
                  </Link>
                  <form action={setUserActive} className="inline">
                    <input type="hidden" name="userId" value={t.userId} />
                    <input type="hidden" name="active" value={String(!t.user.isActive)} />
                    <button
                      type="submit"
                      className={t.user.isActive ? "text-red-700 hover:underline" : "text-emerald-700 hover:underline"}
                    >
                      {t.user.isActive ? "Remove" : "Restore"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Removing a teacher blocks their sign-in and unassigns them as class teacher. Their records are kept and they
        can be restored.
      </p>
    </div>
  );
}
