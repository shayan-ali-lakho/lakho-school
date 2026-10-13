import type { AppRole } from "./roles";

/** Who may record fees and expenses. */
export const FINANCE_ROLES: AppRole[] = ["ADMIN", "PRINCIPAL", "ACCOUNTANT"];
/** Who may see salaries and the combined monthly report. */
export const PAYROLL_ROLES: AppRole[] = ["ADMIN", "PRINCIPAL"];

export const PAYMENT_METHODS = ["Cash", "Bank transfer", "Easypaisa", "JazzCash", "Cheque"] as const;
export const EXPENSE_CATEGORIES = [
  "Rent",
  "Electricity",
  "Water and gas",
  "Internet and phone",
  "Stationery and supplies",
  "Maintenance and repairs",
  "Events",
  "Transport",
  "Other",
] as const;

const pkrFormat = new Intl.NumberFormat("en-PK");
/** 12500 -> "PKR 12,500" */
export const pkr = (n: number) => `PKR ${pkrFormat.format(n)}`;

const TZ = "Asia/Karachi";

/** The current month in Pakistan time, as "YYYY-MM". */
export function currentMonth(): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit" }).formatToParts(
    new Date(),
  );
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  return `${y}-${m}`;
}

/** Accepts a search param and returns a valid "YYYY-MM" (falls back to this month). */
export function parseMonth(value: unknown): string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonth();
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

/** Start (inclusive) and end (exclusive) of a month in Pakistan time. */
export function monthRange(month: string): { start: Date; end: Date } {
  return {
    start: new Date(`${month}-01T00:00:00+05:00`),
    end: new Date(`${shiftMonth(month, 1)}-01T00:00:00+05:00`),
  };
}

export const dateTime = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(d);
export const dateOnly = (d: Date) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: TZ }).format(d);

export function feeStatus(due: number, paid: number): "Paid" | "Partly paid" | "Unpaid" {
  if (paid >= due) return "Paid";
  return paid > 0 ? "Partly paid" : "Unpaid";
}

/** Today's date in Pakistan time, as "YYYY-MM-DD". */
export function todayKarachi(): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** A moment `n` days before now. */
export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 3600 * 1000);
}

/** Salary taken off for days off: base salary / 30 for each day, rounded to the nearest rupee. */
export function dayOffDeduction(baseSalary: number, daysOff: number): number {
  return Math.round((baseSalary / 30) * daysOff);
}
