import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { teacherIdFor } from "@/lib/class-access";
import { todayKarachi } from "@/lib/finance";
import Link from "next/link";
import { saveAttendance, saveTeacherAttendance } from "./actions";

export const metadata: Metadata = { title: "Attendance" };

const OPTIONS = [
  { value: "PRESENT", label: "Present", color: "accent-emerald-600" },
  { value: "ABSENT", label: "Absent", color: "accent-red-600" },
  { value: "LATE", label: "Late", color: "accent-amber-500" },
  { value: "LEAVE", label: "Leave", color: "accent-sky-600" },
] as const;

export default async function AttendancePage(props: PageProps<"/portal/attendance">) {
  const user = await requireRole(["ADMIN", "PRINCIPAL", "MANAGER", "TEACHER"]);
  const sp = await props.searchParams;

  const today = todayKarachi();
  const date = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) && sp.date <= today ? sp.date : today;

  // Only the assigned class teacher may record their students; managers can see every class.
  let teacherFilter = {};
  if (user.role === "TEACHER") {
    const tid = await teacherIdFor(user.id);
    teacherFilter = { classTeacherId: tid ?? "none" };
  }
  const classes = await db.class.findMany({
    where: teacherFilter,
    orderBy: [{ academicYear: "desc" }, { name: "asc" }, { section: "asc" }],
    select: { id: true, name: true, section: true, academicYear: true },
  });
  const classId = classes.find((c) => c.id === sp.classId)?.id ?? classes[0]?.id;

  const students = classId
    ? await db.student.findMany({
        where: { classId, user: { isActive: true } },
        orderBy: { rollNumber: "asc" },
        select: {
          id: true,
          rollNumber: true,
          user: { select: { name: true } },
          attendance: { where: { date: new Date(`${date}T00:00:00.000Z`) }, select: { status: true } },
        },
      })
    : [];
  const marked = students.filter((s) => s.attendance.length > 0).length;
  const canMarkTeachers = ["ADMIN", "PRINCIPAL", "MANAGER"].includes(user.role);
  const view = canMarkTeachers && sp.view === "teachers" ? "teachers" : "students";
  const teachers = view === "teachers" ? await db.teacher.findMany({
    where:{user:{isActive:true}},
    orderBy:{user:{name:"asc"}},
    select:{id:true,employeeId:true,user:{select:{name:true}},attendance:{where:{date:new Date(`${date}T00:00:00.000Z`)},select:{status:true}}}
  }) : [];
  const teacherMarked = teachers.filter(t=>t.attendance.length>0).length;


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <p className="mt-1 text-zinc-600">Select a date and mark attendance using the checklist beside each name. Unmarked rows default to present.</p>
      </div>

      {canMarkTeachers && <div className="flex flex-wrap gap-2">
        <Link href={`/portal/attendance?view=students&date=${date}`} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view==="students"?"bg-brand-700 text-white":"border border-slate-200 bg-white text-slate-700"}`}>Student attendance</Link>
        <Link href={`/portal/attendance?view=teachers&date=${date}`} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view==="teachers"?"bg-brand-700 text-white":"border border-slate-200 bg-white text-slate-700"}`}>Teacher attendance</Link>
      </div>}
      <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
        <input type="hidden" name="view" value={view} />
        {view === "students" && <div>
          <label htmlFor="classId" className="block text-zinc-600">Class</label>
          <select id="classId" name="classId" defaultValue={classId} className="mt-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.section} ({c.academicYear})</option>)}
          </select>
        </div>}
        <div>
          <label htmlFor="date" className="block text-zinc-600">Date</label>
          <input id="date" name="date" type="date" max={today} defaultValue={date} className="mt-1 rounded-md border border-zinc-300 px-2 py-1.5" />
        </div>
        <button type="submit" className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100">Show</button>
      </form>


      <div key={view} className="portal-tab-content">
      {view === "teachers" ? (
        <form action={saveTeacherAttendance} className="space-y-4">
          <input type="hidden" name="date" value={date}/>
          <p className="text-sm text-slate-500">{teacherMarked} of {teachers.length} teachers marked for {date}.</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50"><tr><th className="px-4 py-3">Employee ID</th><th className="px-4 py-3">Teacher</th><th className="px-4 py-3">Attendance checklist</th></tr></thead>
              <tbody>{teachers.map(t=><tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{t.employeeId??"—"}</td><td className="px-4 py-3 font-medium">{t.user.name}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-3">{OPTIONS.map(o=><label key={o.value} className="inline-flex items-center gap-1.5"><input type="radio" name={`t_${t.id}`} value={o.value} defaultChecked={(t.attendance[0]?.status??"PRESENT")===o.value} className={o.color}/>{o.label}</label>)}</div></td>
              </tr>)}</tbody>
            </table>
          </div>
          {teachers.length>0&&<button type="submit" className="rounded-lg bg-brand-700 px-5 py-2.5 font-semibold text-white">Save teacher attendance</button>}
        </form>
      ) : classes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-zinc-600">
          {user.role === "TEACHER" ? "You are not assigned to any class yet." : "No classes yet."}
        </p>
      ) : (
        <form action={saveAttendance} className="space-y-4">
          <input type="hidden" name="classId" value={classId} />
          <input type="hidden" name="date" value={date} />
          <p className="text-sm text-zinc-500">{marked} of {students.length} already marked for this date.</p>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Roll no.</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-zinc-500">No students in this class.</td></tr>}
                {students.map((s) => {
                  const current = s.attendance[0]?.status ?? "PRESENT";
                  return (
                    <tr key={s.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-2">{s.rollNumber}</td>
                      <td className="px-4 py-2">{s.user.name}</td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {OPTIONS.map((o) => (
                            <label key={o.value} className="flex items-center gap-1.5">
                              <input type="radio" name={`s_${s.id}`} value={o.value} defaultChecked={current === o.value} className={o.color} />
                              {o.label}
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {students.length > 0 && (
            <button type="submit" className="rounded-md bg-brand-700 px-5 py-2.5 font-medium text-white hover:bg-brand-800">
              Save attendance
            </button>
          )}
        </form>
      )}
      </div>
    </div>
  );
}
