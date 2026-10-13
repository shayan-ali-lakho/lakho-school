import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { Sidebar } from "@/components/portal/sidebar";
import { navFor } from "@/lib/portal-nav";
import { ROLE_LABELS } from "@/lib/roles";
import { requireUser } from "@/lib/session";
import { site } from "@/lib/site";

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 text-zinc-900 lg:flex-row">
      <Sidebar
        groups={navFor(user.role)}
        title={`${site.shortName} Portal`}
        footer={
          <div className="space-y-3 text-sm">
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
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100"
              >
                Sign out
              </button>
            </form>
          </div>
        }
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
    </div>
  );
}
