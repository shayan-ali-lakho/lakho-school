import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Flash } from "@/components/flash";
import { NavProgress } from "@/components/portal/nav-progress";
import { signOut } from "@/auth";
import { Sidebar } from "@/components/portal/sidebar";
import { navFor } from "@/lib/portal-nav";
import { ROLE_LABELS } from "@/lib/roles";
import { requireUser } from "@/lib/session";
import { site } from "@/lib/site";

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const user = await requireUser();

  return (
    <div className="school-portal flex flex-1 flex-col bg-[#f9f9fc] text-zinc-900 lg:flex-row">
      <Sidebar
        groups={navFor(user.role)}
        title={`${site.shortName} Portal`}
        footer={
          <div className="space-y-3 rounded-2xl bg-[#f5f6fa] p-3 text-sm">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-zinc-500">{ROLE_LABELS[user.role]}</p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirect: false });
                redirect("/");
              }}
            >
              <button
                type="submit"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-100"
              >
                Sign out
              </button>
            </form>
          </div>
        }
      />
      <main className="w-full min-w-0 max-w-none flex-1 px-4 pb-8 sm:px-6 lg:px-8 [&_h1]:text-brand-900">
        <Suspense fallback={null}>
          <Flash />
          <NavProgress />
        </Suspense>
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 py-4">
          <div><p className="text-xs text-slate-500">School management / Workspace</p><p className="mt-1 text-sm font-semibold">Dr. G.M. Lakho Memorial Sec. School</p></div>
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#dce7fb] text-sm font-semibold text-slate-800">{user.name?.slice(0, 1).toUpperCase() || "U"}</span><div><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p></div></div>
        </header>
        {children}
      </main>
    </div>
  );
}
