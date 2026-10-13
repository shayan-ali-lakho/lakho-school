import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { STAFF_ROLES, USER_ADMIN_ROLES } from "@/lib/roles";
import { FEE_TYPE_LABELS, daysAgo, feeStatus, monthLabel, pkr } from "@/lib/finance";
import { loginName } from "@/lib/accounts";
import { DeleteForever } from "@/components/portal/delete-forever";
import { LoginTools } from "@/components/portal/login-tools";
import { setUserActive } from "../../admin/users/actions";

export const metadata: Metadata = { title: "Student" };

export default async function StudentProfilePage(props: PageProps<"/portal/students/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;

  const student = await db.student.findUnique({
    where: { id },
    select: {
      rollNumber: true,
      gender: true,
      address: true,
      dateOfBirth: true,
      admittedOn: true,
      userId: true,
      user: { select: { name: true, email: true, isActive: true } },
      class: { select: { id: true, name: true, section: true, academicYear: true } },
      guardian: { select: { userId: true, phone: true, user: { select: { name: true, email: true } } } },
      feeDiscount: true,
      monthlyFee: true,
      attendance: {
        where: { date: { gte: daysAgo(30) } },
        orderBy: { date: "desc" },
        select: { date: true, status: true },
      },
      invoices: {
        orderBy: { month: "desc" },
        take: 12,
        select: { id: true, month: true, type: true, amount: true, payments: { select: { id: true, amount: true, receiptNo: true } } },
      },
    },
  });
  if (!student) notFound();

  // Staff can open any profile. A student may open their own, and a parent their child's.
  const isStaff = STAFF_ROLES.includes(user.role);
  const canManage = USER_ADMIN_ROLES.includes(user.role);
  const isSelf = user.role === "STUDENT" && student.userId === user.id;
  const isParent = user.role === "PARENT" && student.guardian?.userId === user.id;
  if (!isStaff && !isSelf && !isParent) redirect("/portal");

  const rows: [string, string][] = [
    ["Roll number", student.rollNumber],
    ["Class", student.class ? `${student.class.name} ${student.class.section} (${student.class.academicYear})` : "-"],
    ["Login name", loginName(student.user.email)],
    ["Date of birth", student.dateOfBirth ? student.dateOfBirth.toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" }) : "-"],
    ["Gender", student.gender ?? "-"],
    ["Address", student.address ?? "-"],
    ["Admitted on", student.admittedOn.toLocaleDateString("en-GB", { dateStyle: "medium" })],
    ["Status", student.user.isActive ? "Active" : "Removed (cannot sign in)"],
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        {isStaff && (
          <Link href="/portal/students" className="text-sm text-emerald-700 hover:underline">
            ← Students
          </Link>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{student.user.name}</h1>
          {canManage && (
            <Link
              href={`/portal/students/${id}/edit`}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
            >
              Edit details
            </Link>
          )}
        </div>
      </div>

      <dl className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
            <dt className="text-zinc-500">{label}</dt>
            <dd className="col-span-2">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <h2 className="font-medium">Parent / guardian</h2>
        {student.guardian ? (
          <p className="mt-2 text-zinc-700">
            {student.guardian.user.name} · {loginName(student.guardian.user.email)}
            {student.guardian.phone ? ` · ${student.guardian.phone}` : ""}
          </p>
        ) : (
          <p className="mt-2 text-zinc-500">No parent linked yet.</p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <h2 className="font-medium">Attendance, last 30 days</h2>
        {student.attendance.length === 0 ? (
          <p className="mt-2 text-zinc-500">No attendance recorded yet.</p>
        ) : (
          (() => {
            const count = (st: string) => student.attendance.filter((a) => a.status === st).length;
            const present = count("PRESENT") + count("LATE");
            const pct = Math.round((present / student.attendance.length) * 100);
            return (
              <>
                <p className="mt-2 text-zinc-700">
                  {pct}% present ({present} of {student.attendance.length} days) · {count("ABSENT")} absent · {count("LATE")} late · {count("LEAVE")} on leave
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {student.attendance.slice(0, 14).map((a) => (
                    <li
                      key={a.date.toISOString()}
                      title={`${a.date.toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" })}: ${a.status.toLowerCase()}`}
                      className={`rounded px-2 py-0.5 text-xs ${
                        a.status === "PRESENT" ? "bg-emerald-100 text-emerald-800" : a.status === "ABSENT" ? "bg-red-100 text-red-800" : a.status === "LATE" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {a.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })} · {a.status[0]}
                    </li>
                  ))}
                </ul>
              </>
            );
          })()
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <h2 className="font-medium">Fees</h2>
        {student.monthlyFee !== null && isStaff && (
          <p className="mt-1 text-zinc-500">Monthly fee: {pkr(student.monthlyFee)}</p>
        )}
        {student.invoices.length === 0 ? (
          <p className="mt-2 text-zinc-500">No fee invoices yet.</p>
        ) : (
          <table className="mt-3 w-full text-left">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-1.5 font-medium">Fee</th>
                <th className="py-1.5 font-medium">Month</th>
                <th className="py-1.5 text-right font-medium">Due</th>
                <th className="py-1.5 text-right font-medium">Paid</th>
                <th className="py-1.5 pl-4 font-medium">Status</th>
                <th className="py-1.5 font-medium">Receipts</th>
              </tr>
            </thead>
            <tbody>
              {student.invoices.map((inv) => {
                const paid = inv.payments.reduce((a, p) => a + p.amount, 0);
                const status = feeStatus(inv.amount, paid);
                return (
                  <tr key={inv.id} className="border-t border-zinc-100">
                    <td className="py-1.5">{FEE_TYPE_LABELS[inv.type]}</td>
                    <td className="py-1.5">{monthLabel(inv.month)}</td>
                    <td className="py-1.5 text-right tabular-nums">{inv.amount.toLocaleString("en-PK")}</td>
                    <td className="py-1.5 text-right tabular-nums">{paid.toLocaleString("en-PK")}</td>
                    <td className={`py-1.5 pl-4 ${status === "Paid" ? "text-emerald-700" : status === "Partly paid" ? "text-amber-700" : "text-red-700"}`}>{status}</td>
                    <td className="py-1.5">
                      {inv.payments.map((p) => (
                        <Link key={p.id} href={`/portal/fees/receipt/${p.id}`} className="mr-2 text-emerald-700 hover:underline">
                          #{p.receiptNo}
                        </Link>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {canManage && (
        <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-medium">Login and access</h2>
          <LoginTools userId={student.userId} />
          <form action={setUserActive} className="border-t border-zinc-100 pt-4">
            <input type="hidden" name="userId" value={student.userId} />
            <input type="hidden" name="active" value={String(!student.user.isActive)} />
            <button
              type="submit"
              className={`rounded-md border px-3 py-1.5 text-sm ${
                student.user.isActive
                  ? "border-red-300 text-red-700 hover:bg-red-50"
                  : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {student.user.isActive ? "Remove student from school" : "Restore student"}
            </button>
            <p className="mt-2 text-xs text-zinc-500">
              {student.user.isActive
                ? "Removing blocks sign-in and hides the student from lists. Records are kept and the student can be restored."
                : "This student is removed. Restoring lets them sign in again."}
            </p>
          </form>
          <div className="border-t border-zinc-100 pt-4">
            <DeleteForever userId={student.userId} name={student.user.name} back="/portal/students" className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50" />
            <p className="mt-2 text-xs text-zinc-500">Erases the student, their login, attendance, marks and fee records for good.</p>
          </div>
        </section>
      )}
    </div>
  );
}
