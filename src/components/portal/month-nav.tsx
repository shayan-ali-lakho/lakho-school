import Link from "next/link";
import { monthLabel, shiftMonth } from "@/lib/finance";

/** Previous / next month links around the month title. `extra` keeps other filters in the URL. */
export function MonthNav({ basePath, month, extra = "" }: { basePath: string; month: string; extra?: string }) {
  const href = (m: string) => `${basePath}?month=${m}${extra}`;
  const btn = "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-100";
  return (
    <div className="flex items-center gap-2">
      <Link href={href(shiftMonth(month, -1))} className={btn} aria-label="Previous month">
        ←
      </Link>
      <span className="min-w-36 text-center font-medium">{monthLabel(month)}</span>
      <Link href={href(shiftMonth(month, 1))} className={btn} aria-label="Next month">
        →
      </Link>
    </div>
  );
}
