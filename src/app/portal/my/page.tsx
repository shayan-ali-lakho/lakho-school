import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "My children" };

export default async function MyPage() {
  const user = await requireRole(["STUDENT", "PARENT"]);

  if (user.role === "STUDENT") {
    const me = await db.student.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (me) redirect(`/portal/students/${me.id}`);
    return <p className="text-zinc-600">Your student profile has not been set up yet. Please ask the school office.</p>;
  }

  const kids = await db.student.findMany({
    where: { guardian: { userId: user.id }, user: { isActive: true } },
    orderBy: { user: { name: "asc" } },
    select: { id: true, rollNumber: true, user: { select: { name: true } }, class: { select: { name: true, section: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My children</h1>
        <p className="mt-1 text-zinc-600">Open a profile to see fees, receipts and attendance.</p>
      </div>
      {kids.length === 0 && <p className="text-zinc-500">No children are linked to your account yet. Please ask the school office.</p>}
      <ul className="grid gap-4 sm:grid-cols-2">
        {kids.map((k) => (
          <li key={k.id} className="rounded-lg border border-zinc-200 bg-white p-5">
            <p className="text-lg font-medium">{k.user.name}</p>
            <p className="text-sm text-zinc-500">{k.class ? `${k.class.name} ${k.class.section}` : "No class"} · Roll {k.rollNumber}</p>
            <div className="mt-3 flex gap-4 text-sm">
              <Link href={`/portal/students/${k.id}`} className="text-emerald-700 hover:underline">Profile, fees, attendance</Link>
              <Link href="/portal/results" className="text-emerald-700 hover:underline">Results</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
