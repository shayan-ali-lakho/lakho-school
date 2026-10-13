import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ROLE_LABELS, USER_ADMIN_ROLES, type AppRole } from "@/lib/roles";

const ASSIGNABLE: AppRole[] = ["ADMIN", "PRINCIPAL", "ACCOUNTANT", "TEACHER"];
import { loginName } from "@/lib/accounts";
import { changeRole, setUserActive } from "./actions";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  // Server-side role check: the proxy redirect is only a convenience.
  const actor = await requireRole(USER_ADMIN_ROLES);

  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Logins and roles</h1>
          <p className="mt-1 text-zinc-600">{users.length} accounts</p>
        </div>
        <Link
          href="/portal/admin/users/new"
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          New user
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Login name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-zinc-600">{loginName(u.email)}</td>
                <td className="px-4 py-3">
                  {ASSIGNABLE.includes(u.role) && u.id !== actor.id && (actor.role === "ADMIN" || (u.role !== "ADMIN" && u.role !== "PRINCIPAL")) ? (
                    <form action={changeRole} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        aria-label={`Role for ${u.name}`}
                        className="rounded-md border border-zinc-300 bg-white px-2 py-1"
                      >
                        {ASSIGNABLE.filter((r) => actor.role === "ADMIN" || (r !== "ADMIN" && r !== "PRINCIPAL")).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="text-emerald-700 hover:underline">
                        Save
                      </button>
                    </form>
                  ) : (
                    ROLE_LABELS[u.role]
                  )}
                </td>
                <td className="px-4 py-3">{u.isActive ? "Active" : "Disabled"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/portal/admin/users/${u.id}`} className="mr-4 text-emerald-700 hover:underline">
                    Edit
                  </Link>
                  <Link
                    href={`/portal/admin/users/${u.id}/password`}
                    className="mr-4 text-emerald-700 hover:underline"
                  >
                    Reset password
                  </Link>
                  {u.id !== actor.id && (
                    <form action={setUserActive} className="inline">
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="active" value={String(!u.isActive)} />
                      <button type="submit" className="text-emerald-700 hover:underline">
                        {u.isActive ? "Disable" : "Enable"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
