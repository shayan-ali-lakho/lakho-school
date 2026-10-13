import type { AppRole } from "./roles";

export type NavItem = { href: string; label: string; roles: AppRole[] };
export type NavGroup = { label: string; items: NavItem[] };

const ALL: AppRole[] = ["ADMIN", "PRINCIPAL", "TEACHER", "ACCOUNTANT", "STUDENT", "PARENT"];
const STAFF: AppRole[] = ["ADMIN", "PRINCIPAL", "TEACHER", "ACCOUNTANT"];
const MANAGERS: AppRole[] = ["ADMIN", "PRINCIPAL"];
const FINANCE: AppRole[] = ["ADMIN", "PRINCIPAL", "ACCOUNTANT"];

/** Every section of the portal. Add new modules here and they appear in the sidebar for the roles listed. */
export const PORTAL_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/portal", label: "Dashboard", roles: ALL }],
  },
  {
    label: "People",
    items: [
      { href: "/portal/students", label: "Students", roles: STAFF },
      { href: "/portal/teachers", label: "Teachers", roles: MANAGERS },
      { href: "/portal/classes", label: "Classes", roles: STAFF },
      { href: "/portal/admin/users", label: "Logins and roles", roles: MANAGERS },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/portal/fees", label: "Student fees", roles: FINANCE },
      { href: "/portal/fees/structure", label: "Class fees", roles: FINANCE },
      { href: "/portal/salaries", label: "Teacher salaries", roles: MANAGERS },
      { href: "/portal/expenses", label: "School expenses", roles: FINANCE },
      { href: "/portal/reports", label: "Monthly report", roles: MANAGERS },
    ],
  },
  {
    label: "Website",
    items: [{ href: "/portal/inquiries", label: "Inquiries", roles: MANAGERS }],
  },
];

/** The groups (and items) a role may see. */
export function navFor(role: AppRole): NavGroup[] {
  return PORTAL_NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) })).filter(
    (g) => g.items.length > 0,
  );
}
