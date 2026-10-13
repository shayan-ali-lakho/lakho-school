import type { Metadata } from "next";
import { btnDanger, btnPrimary, btnSm } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { STAFF_ROLES, USER_ADMIN_ROLES } from "@/lib/roles";
import { visibleClasses } from "@/lib/class-access";
import { addCourse, addSubject, deleteSubject, removeCourse, setCourseTeacher } from "./actions";

export const metadata: Metadata = { title: "Courses" };

const sel = "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm";

export default async function CoursesPage(props: PageProps<"/portal/courses">) {
  const user = await requireRole(STAFF_ROLES);
  const canManage = USER_ADMIN_ROLES.includes(user.role);
  const sp = await props.searchParams;

  const classes = await visibleClasses(user);
  const classId = classes.find((c) => c.id === sp.classId)?.id ?? classes[0]?.id ?? "";

  const [subjects, teachers, courses] = await Promise.all([
    db.subject.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, _count: { select: { courses: true } } } }),
    db.teacher.findMany({
      where: { user: { isActive: true } },
      orderBy: { user: { name: "asc" } },
      select: { id: true, user: { select: { name: true } } },
    }),
    classId
      ? db.course.findMany({
          where: { classId },
          orderBy: { subject: { name: "asc" } },
          select: { id: true, teacherId: true, subject: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);
  const taken = new Set(courses.map((c) => c.subject.name));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
        <p className="mt-1 text-zinc-600">The subjects each class studies and who teaches them.</p>
      </div>


      <section className="space-y-3">
        <h2 className="text-lg font-medium">Subjects</h2>
        <ul className="flex flex-wrap gap-2">
          {subjects.length === 0 && <li className="text-zinc-500">No subjects yet.</li>}
          {subjects.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-1 text-sm">
              {s.name}
              {canManage && s._count.courses === 0 && (
                <form action={deleteSubject}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="classId" value={classId} />
                  <ConfirmButton label="✕" title={`Delete ${s.name}?`} message="The subject will be removed. This cannot be undone." className="text-zinc-400 hover:text-red-700" />
                </form>
              )}
            </li>
          ))}
        </ul>
        {canManage && (
          <form action={addSubject} className="flex gap-2">
            <input type="hidden" name="classId" value={classId} />
            <input name="name" required maxLength={60} placeholder="New subject, e.g. Mathematics" aria-label="New subject name" className="w-72 rounded-md border border-zinc-300 px-3 py-2 text-sm" />
            <button type="submit" className={btnPrimary}>
              + Add subject
            </button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Courses by class</h2>
          <form method="get" className="flex items-center gap-2 text-sm">
            <label htmlFor="classId" className="text-zinc-600">Class</label>
            <select id="classId" name="classId" defaultValue={classId} className={sel}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <button type="submit" className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100">Show</button>
          </form>
        </div>

        {classes.length === 0 ? (
          <p className="text-zinc-500">Add a class first.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Teacher</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-zinc-500">No courses in this class yet.</td></tr>
                )}
                {courses.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3">{c.subject.name}</td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <form action={setCourseTeacher} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="classId" value={classId} />
                          <select name="teacherId" defaultValue={c.teacherId ?? ""} aria-label={`Teacher for ${c.subject.name}`} className={sel}>
                            <option value="">Not assigned</option>
                            {teachers.map((t) => (
                              <option key={t.id} value={t.id}>{t.user.name}</option>
                            ))}
                          </select>
                          <button type="submit" className="text-emerald-700 hover:underline">Save</button>
                        </form>
                      ) : (
                        teachers.find((t) => t.id === c.teacherId)?.user.name ?? "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage && (
                        <form action={removeCourse}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="classId" value={classId} />
                          <ConfirmButton label="Remove" title="Remove this course from the class?" message="Marks entered for it stay with the exam, but the class will no longer study this subject." confirmLabel="Yes, remove" className={`${btnDanger} ${btnSm}`} />
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {canManage && classId && (
          <form action={addCourse} className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4">
            <input type="hidden" name="classId" value={classId} />
            <div>
              <label htmlFor="subjectId" className="block text-sm text-zinc-600">Add subject to this class</label>
              <select id="subjectId" name="subjectId" required defaultValue="" className={`mt-1 ${sel}`}>
                <option value="" disabled>Choose...</option>
                {subjects.filter((s) => !taken.has(s.name)).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="teacherId" className="block text-sm text-zinc-600">Teacher</label>
              <select id="teacherId" name="teacherId" defaultValue="" className={`mt-1 ${sel}`}>
                <option value="">Not assigned</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.user.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className={btnPrimary}>
              + Add course
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
