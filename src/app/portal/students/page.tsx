import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAFF_ROLES, USER_ADMIN_ROLES } from "@/lib/roles";
import { btnPrimary } from "@/components/ui";
import { StudentGrid } from "@/components/portal/student-grid";

export const metadata: Metadata = { title: "Students" };

export default async function StudentsPage(props: PageProps<"/portal/students">) {
  const user = await requireRole(STAFF_ROLES);
  const canManage = USER_ADMIN_ROLES.includes(user.role);

  const { classId, removed } = await props.searchParams;
  const selectedClass = typeof classId === "string" && classId ? classId : undefined;
  const showRemoved = removed === "1";

  const [classes, students] = await Promise.all([
    db.class.findMany({
      orderBy: [{ academicYear: "desc" }, { name: "asc" }, { section: "asc" }],
      select: { id: true, name: true, section: true, academicYear: true },
    }),
    db.student.findMany({
      where: {
        ...(selectedClass ? { classId: selectedClass } : {}),
        user: { isActive: !showRemoved },
      },
      orderBy: [{ class: { name: "asc" } }, { rollNumber: "asc" }],
      take: 300,
      select: {
        id: true,
        userId: true,
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
          <p className="mt-1 text-zinc-600">
            {students.length} {showRemoved ? "removed students" : "students"}
          </p>
        </div>
        {canManage && (
          <Link href="/portal/students/new" className={btnPrimary}>
            + Admit student
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
        <label className="ml-2 flex items-center gap-1.5 text-zinc-600">
          <input type="checkbox" name="removed" value="1" defaultChecked={showRemoved} />
          Show removed
        </label>
        <button type="submit" className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100">
          Filter
        </button>
      </form>

      <StudentGrid canManage={canManage} students={students.map(s=>({id:s.id,rollNumber:s.rollNumber,name:s.user.name,className:s.class?`${s.class.name} ${s.class.section}`:"—",guardian:s.guardian?.user.name??"—",active:s.user.isActive}))}/>
    </div>
  );
}
