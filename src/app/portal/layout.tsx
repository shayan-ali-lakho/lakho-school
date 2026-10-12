import Link from "next/link";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/session";
import { ROLE_LABELS, STAFF_ROLES, USER_ADMIN_ROLES } from "@/lib/roles";
import { site } from "@/lib/site";

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/portal" className="font-semibold tracking-tight">
              {site.name} Portal
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-600">
              {STAFF_ROLES.includes(user.role) && (
                <>
                  <Link href="/portal/classes" className="hover:text-zinc-900">
                    Classes
                  </Link>
                  <Link href="/portal/students" className="hover:text-zinc-900">
                    Students
                  </Link>
                </>
              )}
              {USER_ADMIN_ROLES.includes(user.role) && (
                <>
                  <Link href="/portal/teachers" className="hover:text-zinc-900">
                    Teachers
                  </Link>
                  <Link href="/portal/admin/users" className="hover:text-zinc-900">
                    Users
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-zinc-600">
              {user.name} · {ROLE_LABELS[user.role]}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
