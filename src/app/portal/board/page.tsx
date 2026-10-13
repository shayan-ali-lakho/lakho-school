import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { isBoardClass } from "@/lib/academics";
import { todayKarachi } from "@/lib/finance";
import { saveBoardRecord } from "./actions";

export const metadata: Metadata = { title: "Board exams" };

const cell = "w-full min-w-24 rounded-md border border-zinc-300 px-2 py-1";

export default async function BoardPage(props: PageProps<"/portal/board">) {
  await requireRole(USER_ADMIN_ROLES);
  const sp = await props.searchParams;

  const today = todayKarachi();
  const defaultYear = String(Number(today.slice(0, 4)) + (Number(today.slice(5, 7)) >= 7 ? 1 : 0));
  const year = typeof sp.year === "string" && /^\d{4}$/.test(sp.year) ? sp.year : defaultYear;
  const savedId = typeof sp.saved === "string" ? sp.saved : undefined;

  const classes = (await db.class.findMany({ select: { id: true, name: true } })).filter((c) => isBoardClass(c.name));
  const students = await db.student.findMany({
    where: { classId: { in: classes.map((c) => c.id) }, user: { isActive: true } },
    orderBy: [{ class: { name: "asc" } }, { rollNumber: "asc" }],
    select: {
      id: true,
      rollNumber: true,
      user: { select: { name: true } },
      class: { select: { name: true, section: true } },
      boardRecords: { where: { examYear: year }, select: { boardRollNo: true, registrationNo: true, groupName: true, result: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Board exams</h1>
          <p className="mt-1 text-zinc-600">Registration and results for Class 9 and 10 students.</p>
        </div>
        <form method="get" className="flex items-center gap-2 text-sm">
          <label htmlFor="year" className="text-zinc-600">Board exam year</label>
          <input id="year" name="year" defaultValue={year} inputMode="numeric" pattern="\d{4}" className="w-24 rounded-md border border-zinc-300 px-2 py-1.5" />
          <button type="submit" className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100">Show</button>
        </form>
      </div>

      {students.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-zinc-600">
          No students in Class 9 or 10 yet. Classes named like &quot;Class 9&quot; or &quot;Class 10&quot; appear here.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-3 py-3 font-medium">Student</th>
                <th className="px-3 py-3 font-medium">Class</th>
                <th className="px-3 py-3 font-medium">Board roll no.</th>
                <th className="px-3 py-3 font-medium">Registration no.</th>
                <th className="px-3 py-3 font-medium">Group</th>
                <th className="px-3 py-3 font-medium">Result</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const r = s.boardRecords[0];
                const formId = `board-${s.id}`;
                return (
                  <tr key={s.id} className="border-b border-zinc-100 align-top last:border-0">
                    <td className="px-3 py-2">{s.user.name}<div className="text-xs text-zinc-500">Roll {s.rollNumber}</div></td>
                    <td className="px-3 py-2">{s.class ? `${s.class.name} ${s.class.section}` : "-"}</td>
                    <td className="px-3 py-2"><input form={formId} name="boardRollNo" defaultValue={r?.boardRollNo ?? ""} aria-label="Board roll number" className={cell} /></td>
                    <td className="px-3 py-2"><input form={formId} name="registrationNo" defaultValue={r?.registrationNo ?? ""} aria-label="Registration number" className={cell} /></td>
                    <td className="px-3 py-2"><input form={formId} name="groupName" defaultValue={r?.groupName ?? ""} placeholder="Science / Arts" aria-label="Group" className={cell} /></td>
                    <td className="px-3 py-2"><input form={formId} name="result" defaultValue={r?.result ?? ""} placeholder="e.g. A1, 850/1100" aria-label="Result" className={cell} /></td>
                    <td className="px-3 py-2">
                      <form id={formId} action={saveBoardRecord}>
                        <input type="hidden" name="studentId" value={s.id} />
                        <input type="hidden" name="examYear" value={year} />
                        <button type="submit" className="text-emerald-700 hover:underline">Save</button>
                        {savedId === s.id && <span className="ml-2 text-xs text-emerald-700">Saved</span>}
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
