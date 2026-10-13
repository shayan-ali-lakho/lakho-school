import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { USER_ADMIN_ROLES } from "@/lib/roles";
import { setApplicationStatus, setMessageHandled } from "./actions";

export const metadata: Metadata = { title: "Website inquiries" };

const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" });
const day = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

export default async function InquiriesPage() {
  await requireRole(USER_ADMIN_ROLES);

  const [applications, messages] = await Promise.all([
    db.admissionApplication.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Website inquiries</h1>
        <p className="mt-1 text-zinc-600">Admission applications and messages sent from the public website.</p>
      </div>

      <section>
        <h2 className="text-lg font-medium">Admission applications ({applications.length})</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Child</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Parent</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                    No applications yet.
                  </td>
                </tr>
              )}
              {applications.map((a) => (
                <tr key={a.id} className="border-b border-zinc-100 align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{when.format(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div>{a.childName}</div>
                    <div className="text-zinc-500">
                      {a.gender}, born {day.format(a.dateOfBirth)}
                    </div>
                    {a.previousSchool && <div className="text-zinc-500">From: {a.previousSchool}</div>}
                  </td>
                  <td className="px-4 py-3">{a.classApplied}</td>
                  <td className="px-4 py-3">{a.guardianName}</td>
                  <td className="px-4 py-3">
                    <div>{a.phone}</div>
                    {a.email && <div className="text-zinc-500">{a.email}</div>}
                    {a.address && <div className="text-zinc-500">{a.address}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <form action={setApplicationStatus} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={a.id} />
                      <select name="status" defaultValue={a.status} aria-label={`Status for ${a.childName}`} className="rounded-md border border-zinc-300 bg-white px-2 py-1">
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="DECLINED">Declined</option>
                      </select>
                      <button type="submit" className="text-emerald-700 hover:underline">Save</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Contact messages ({messages.length})</h2>
        <ul className="mt-3 space-y-3">
          {messages.length === 0 && <li className="text-zinc-500">No messages yet.</li>}
          {messages.map((m) => (
            <li key={m.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">{m.name}</span>
                <span className="text-sm text-zinc-500">{when.format(m.createdAt)}</span>
              </div>
              <p className="text-sm text-zinc-500">{[m.phone, m.email].filter(Boolean).join(" · ")}</p>
              <p className="mt-2 whitespace-pre-line">{m.message}</p>
              <form action={setMessageHandled} className="mt-3">
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="handled" value={String(!m.handled)} />
                <button type="submit" className="text-sm text-emerald-700 hover:underline">
                  {m.handled ? "Handled. Mark as not handled" : "Mark as handled"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
