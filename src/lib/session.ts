import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { AppRole } from "@/lib/roles";

/** Use in server components / actions: returns the user or redirects to /login. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const record = await db.user.findUnique({where:{id:session.user.id},select:{role:true,isActive:true}});
  if(!record?.isActive) redirect("/login");
  return {...session.user,role:record.role};
}

/** Like requireUser, but also enforces the role on the server (never trust the UI alone). */
export async function requireRole(allowed: AppRole[]) {
  const user = await requireUser();
  const financeOnly = user.role === "FINANCE" || user.role === "ACCOUNTANT";
  const isFinanceRoute = allowed.includes("FINANCE") || allowed.includes("ACCOUNTANT");
  if (user.role === "ADMIN" && isFinanceRoute && !allowed.includes("TEACHER")) redirect("/portal");
  if (financeOnly && !isFinanceRoute) redirect("/portal/fees");
  if (!allowed.includes(user.role) && !(user.role === "MANAGER" && (allowed.includes("ADMIN") || allowed.includes("PRINCIPAL")))) redirect(financeOnly ? "/portal/fees" : "/portal");
  return user;
}
