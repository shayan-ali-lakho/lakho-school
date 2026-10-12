import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AppRole } from "@/lib/roles";

/** Use in server components / actions: returns the user or redirects to /login. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Like requireUser, but also enforces the role on the server (never trust the UI alone). */
export async function requireRole(allowed: AppRole[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role)) redirect("/portal");
  return user;
}
