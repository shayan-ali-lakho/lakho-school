import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { dateOnly } from "@/lib/finance";

export const metadata: Metadata = { title: "Results" };

export default async function MyResultsPage() {
  const user = await requireRole(["STUDENT", "PARENT"]);

  const students = await db.student.findMany({
    where: user.role === "STUDENT" ? { userId: user.id } : { guardian: { userId: user.id }, user: { isActive: true } },
    orderBy: { user: { name: "asc" } },
    select: {
      id: true,
      user: { select: { name: true } },
      marks: { select: { exam: { select: { id: true, name: true, kind: true, examDate: true, createdAt: true } } } },
    },
  });

  // Each exam once per student, newest first.
  const rows = students.map((s) => {
    const seen = new Map<string, (typeof s.marks)[number]["exam"]>();
    for (const m of s.marks) seen.set(m.exam.id, m.exam);
    const exams = [...seen.values()].sort((a, b) => (b.examDate ?? b.createdAt).getTime() - (a.examDate ?? a.createdAt).getTime());
    return { id: s.id, name: s.user.name, exams };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Results</h1>
        <p className="mt-1 text-zinc-600">Tests and examinations with report cards.</p>
      </div>
      {rows.length === 0 && <p className="text-zinc-500">No students linked to your account yet.</p>}
      {rows.map((s) => (
        <section key={s.id} className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="font-medium">{s.name}</h2>
          {s.exams.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No results published yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {s.exams.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span>
                    {e.name}
                    <span className="ml-2 text-zinc-500">{e.kind}{e.examDate ? ` · ${dateOnly(e.examDate)}` : ""}</span>
                  </span>
                  <Link href={`/portal/exams/${e.id}/report/${s.id}`} className="text-emerald-700 hover:underline">Report card</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
