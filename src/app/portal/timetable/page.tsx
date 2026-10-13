import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { DAYS } from "@/lib/academics";
import { visibleClasses } from "@/lib/class-access";
import { addSlot, deleteSlot } from "./actions";

export const metadata: Metadata = { title: "Timetable" };

const sel = "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm";

export default async function TimetablePage(props: PageProps<"/portal/timetable">) {
  const user = await requireUser();
  const canManage = USER_ADMIN_ROLES.includes(user.role);
  const sp = await props.searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const classes = await visibleClasses(user);
  const classId = classes.find((c) => c.id === sp.classId)?.id ?? classes[0]?.id ?? "";

  const [courses, slots] = classId
    ? await Promise.all([
        db.course.findMany({
          where: { classId },
          orderBy: { subject: { name: "asc" } },
          select: { id: true, subject: { select: { name: true } }, teacher: { select: { user: { select: { name: true } } } } },
        }),
        db.timetableSlot.findMany({
          where: { course: { classId } },
          orderBy: [{ day: "asc" }, { startTime: "asc" }],
          select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
            course: { select: { subject: { select: { name: true } }, teacher: { select: { user: { select: { name: true } } } } } },
          },
        }),
      ])
    : [[], []];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timetable</h1>
          <p className="mt-1 text-zinc-600">Weekly lessons for each class.</p>
        </div>
        {classes.length > 1 && (
          <form method="get" className="flex items-center gap-2 text-sm">
            <label htmlFor="classId" className="text-zinc-600">Class</label>
            <select id="classId" name="classId" defaultValue={classId} className={sel}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <button type="submit" className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100">Show</button>
          </form>
        )}
      </div>

      {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {classes.length === 0 ? (
        <p className="text-zinc-500">No class to show.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {DAYS.map((d) => {
              const day = slots.filter((s) => s.day === d.n);
              return (
                <section key={d.n} className="rounded-lg border border-zinc-200 bg-white p-4">
                  <h2 className="font-medium">{d.label}</h2>
                  {day.length === 0 ? (
                    <p className="mt-2 text-sm text-zinc-400">No lessons</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-zinc-100">
                      {day.map((s) => (
                        <li key={s.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                          <div>
                            <p className="font-medium">{s.course.subject.name}</p>
                            <p className="text-zinc-500">{s.course.teacher?.user.name ?? "No teacher assigned"}</p>
                          </div>
                          <div className="text-right">
                            <p className="tabular-nums text-zinc-700">{s.startTime} - {s.endTime}</p>
                            {canManage && (
                              <form action={deleteSlot}>
                                <input type="hidden" name="id" value={s.id} />
                                <input type="hidden" name="classId" value={classId} />
                                <button type="submit" className="text-xs text-red-700 hover:underline">Delete</button>
                              </form>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>

          {canManage && (
            <form action={addSlot} className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4">
              <input type="hidden" name="classId" value={classId} />
              <div>
                <label htmlFor="day" className="block text-sm text-zinc-600">Day</label>
                <select id="day" name="day" required defaultValue="" className={`mt-1 ${sel}`}>
                  <option value="" disabled>Choose...</option>
                  {DAYS.map((d) => <option key={d.n} value={d.n}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="courseId" className="block text-sm text-zinc-600">Subject</label>
                <select id="courseId" name="courseId" required defaultValue="" className={`mt-1 ${sel}`}>
                  <option value="" disabled>Choose...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.subject.name}{c.teacher ? ` (${c.teacher.user.name})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="startTime" className="block text-sm text-zinc-600">Starts</label>
                <input id="startTime" name="startTime" type="time" required className={`mt-1 ${sel}`} />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm text-zinc-600">Ends</label>
                <input id="endTime" name="endTime" type="time" required className={`mt-1 ${sel}`} />
              </div>
              <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
                Add lesson
              </button>
              {courses.length === 0 && (
                <p className="w-full text-sm text-zinc-500">Add subjects to this class under Courses first.</p>
              )}
            </form>
          )}
        </>
      )}
    </div>
  );
}
