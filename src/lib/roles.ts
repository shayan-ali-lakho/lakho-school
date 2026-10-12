export const ROLES = [
  "ADMIN",
  "PRINCIPAL",
  "TEACHER",
  "ACCOUNTANT",
  "STUDENT",
  "PARENT",
] as const;

export type AppRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Administrator",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  ACCOUNTANT: "Accountant",
  STUDENT: "Student",
  PARENT: "Parent",
};

/** Roles allowed to see the staff/admin area. */
export const STAFF_ROLES: AppRole[] = ["ADMIN", "PRINCIPAL", "TEACHER", "ACCOUNTANT"];
/** Roles allowed to manage users. */
export const USER_ADMIN_ROLES: AppRole[] = ["ADMIN", "PRINCIPAL"];
