import type { AppRole } from "./roles";

export type NavItem = { href: string; label: string; roles: AppRole[] };
export type NavGroup = { label: string; items: NavItem[] };

const ALL: AppRole[] = ["ADMIN", "PRINCIPAL", "MANAGER", "TEACHER", "ACCOUNTANT", "FINANCE", "STUDENT", "PARENT"];
const STAFF: AppRole[] = ["ADMIN", "PRINCIPAL", "MANAGER", "TEACHER"];
const MANAGERS: AppRole[] = ["ADMIN", "PRINCIPAL", "MANAGER"];
const FINANCE: AppRole[] = ["PRINCIPAL", "MANAGER", "FINANCE", "ACCOUNTANT"];

/** Every section of the portal. Add new modules here and they appear in the sidebar for the roles listed. */
export const PORTAL_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/portal/profile", label: "My profile", roles: ALL }, { href: "/portal", label: "Dashboard", roles: ALL.filter(r => r !== "FINANCE" && r !== "ACCOUNTANT") }, { href: "/portal/cards", label: "ID cards", roles: ["ADMIN","PRINCIPAL","MANAGER","STUDENT","TEACHER"] }, { href: "/portal/admit-cards", label: "Admit cards", roles: ["ADMIN","PRINCIPAL","MANAGER","STUDENT"] }],
  },
  {
    label: "My family",
    items: [
      { href: "/portal/my", label: "My profile / children", roles: ["STUDENT", "PARENT"] },
      { href: "/portal/results", label: "Results", roles: ["STUDENT", "PARENT"] },
    ],
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
    label: "Academics",
    items: [
      { href: "/portal/courses", label: "Courses", roles: STAFF },
      { href: "/portal/timetable", label: "Timetable", roles: ALL },
      { href: "/portal/exams", label: "Exams and results", roles: STAFF },
      { href: "/portal/attendance", label: "Attendance", roles: ["ADMIN", "PRINCIPAL", "MANAGER", "TEACHER"] },
      { href: "/portal/board", label: "Board exams", roles: MANAGERS },
    ],
  },
  {
    label: "Communication",
    items: [{ href: "/portal/announcements", label: "Announcements", roles: ["ADMIN","PRINCIPAL","MANAGER"] }, { href: "/portal/complaints", label: "Complaints", roles: ALL.filter(r => r !== "FINANCE" && r !== "ACCOUNTANT") }],
  },
  {
    label: "Fees",
    items: [
      { href: "/portal/fees/add", label: "Add fees", roles: FINANCE },
      { href: "/portal/fees", label: "View fees", roles: FINANCE },
      { href: "/portal/fees/structure", label: "Class and student fees", roles: FINANCE },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/portal/salaries", label: "Teacher salaries", roles: MANAGERS },
      { href: "/portal/expenses", label: "School expenses", roles: FINANCE },
    ],
  },
  {
    label: "Reports",
    items: [{ href: "/portal/class-reports", label: "Class-wise reports", roles: ["PRINCIPAL","MANAGER"] }, { href: "/portal/reports", label: "Monthly finance report", roles: ["PRINCIPAL","MANAGER"] }],
  },
  {
    label: "Website",
    items: [{ href: "/portal/inquiries", label: "Inquiries", roles: MANAGERS }],
  },
];

/** The groups (and items) a role may see. */
export function navFor(role: AppRole): NavGroup[] {
  if (role === "FINANCE" || role === "ACCOUNTANT") return PORTAL_NAV.filter(g => g.label === "Fees" || g.label === "Money" || g.label === "Overview").map(g => ({...g,items:g.items.filter(i => i.roles.includes(role))})).filter(g=>g.items.length>0);
  return PORTAL_NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) })).filter(
    (g) => g.items.length > 0,
  );
}
