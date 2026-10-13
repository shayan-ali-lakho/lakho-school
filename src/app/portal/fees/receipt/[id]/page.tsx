import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { FEE_TYPE_LABELS, FINANCE_ROLES, dateTime, monthLabel, pkr } from "@/lib/finance";
import { site } from "@/lib/site";
import { PrintButton } from "@/components/portal/print-button";

export const metadata: Metadata = { title: "Fee receipt" };

export default async function ReceiptPage(props: PageProps<"/portal/fees/receipt/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;

  const p = await db.feePayment.findUnique({
    where: { id },
    select: {
      receiptNo: true,
      amount: true,
      paidOn: true,
      method: true,
      note: true,
      receivedBy: { select: { name: true } },
      invoice: {
        select: {
          month: true,
          type: true,
          amount: true,
          payments: { select: { amount: true } },
          student: {
            select: {
              rollNumber: true,
              userId: true,
              user: { select: { name: true } },
              class: { select: { name: true, section: true } },
              guardian: { select: { userId: true, user: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });
  if (!p) notFound();

  const st = p.invoice.student;
  const allowed =
    FINANCE_ROLES.includes(user.role) ||
    (user.role === "STUDENT" && st.userId === user.id) ||
    (user.role === "PARENT" && st.guardian?.userId === user.id);
  if (!allowed) redirect("/portal");

  const totalPaid = p.invoice.payments.reduce((s, x) => s + x.amount, 0);

  const rows: [string, string][] = [
    ["Student", st.user.name],
    ["Class", st.class ? `${st.class.name} ${st.class.section}` : "-"],
    ["Roll number", st.rollNumber],
    ["Fee for", `${FEE_TYPE_LABELS[p.invoice.type]} · ${monthLabel(p.invoice.month)}`],
    ["Payment method", p.method],
    ["Fee amount", pkr(p.invoice.amount)],
    ["Paid to date", pkr(totalPaid)],
    ["Balance", pkr(Math.max(0, p.invoice.amount - totalPaid))],
  ];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href={FINANCE_ROLES.includes(user.role) ? "/portal/fees" : "/portal"} className="text-sm text-emerald-700 hover:underline">
          ← Back
        </Link>
        <PrintButton />
      </div>
      <article className="rounded-lg border border-zinc-300 bg-white p-8 print:border-0 print:p-0">
        <header className="border-b border-zinc-200 pb-4 text-center">
          <p className="text-lg font-semibold">{site.name}</p>
          {site.address && <p className="text-sm text-zinc-600">{site.address}</p>}
          <p className="text-sm text-zinc-600">{site.phone}</p>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">Fee receipt</h1>
        </header>
        <div className="mt-4 flex justify-between text-sm">
          <span>Receipt no. <strong>{p.receiptNo}</strong></span>
          <span>{dateTime(p.paidOn)}</span>
        </div>
        <dl className="mt-4 divide-y divide-zinc-100 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-2 gap-4 py-2">
              <dt className="text-zinc-500">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-center justify-between rounded-md bg-zinc-50 px-4 py-3">
          <span className="font-medium">Amount received</span>
          <span className="text-xl font-semibold">{pkr(p.amount)}</span>
        </div>
        {p.note && <p className="mt-3 text-sm text-zinc-600">Note: {p.note}</p>}
        <p className="mt-6 text-xs text-zinc-500">Received by {p.receivedBy?.name ?? "school office"}. Thank you.</p>
      </article>
    </div>
  );
}
