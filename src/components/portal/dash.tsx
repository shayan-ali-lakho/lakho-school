import Link from "next/link";
import type { ReactNode } from "react";

/* ---------- icons ---------- */

const PATHS = {
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  cap: "M22 10 12 5 2 10l10 5 10-5z M6 12v5c3 3 9 3 12 0v-5",
  wallet: "M20 12V8H6a2 2 0 0 1 0-4h12v4 M4 6v12a2 2 0 0 0 2 2h14v-4 M18 12a2 2 0 0 0 0 4h4v-4z",
  alert: "M12 9v4 M12 17h.01 M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  check: "M20 6 9 17l-5-5",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
  calendar: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  trend: "M3 3v18h18 M7 14l4-4 4 4 5-5",
  arrow: "M5 12h14 M12 5l7 7-7 7",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
  clipboard: "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
  building: "M3 21h18 M5 21V7l7-4 7 4v14 M9 21v-6h6v6",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M2 12h20 M12 2a15 15 0 0 1 0 20 M12 2a15 15 0 0 0 0 20",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Choose an icon for a portal link from its address. */
export function iconForHref(href: string): IconName {
  const rules: [string, IconName][] = [
    ["student", "cap"], ["teacher", "users"], ["users", "users"], ["class", "building"], ["course", "book"],
    ["timetable", "clock"], ["attendance", "check"], ["exam", "clipboard"], ["result", "clipboard"],
    ["board", "clipboard"], ["announce", "bell"], ["fee", "wallet"], ["salar", "wallet"], ["expense", "trend"],
    ["report", "trend"], ["inquir", "mail"], ["website", "globe"], ["my", "users"],
  ];
  return rules.find(([k]) => href.includes(k))?.[1] ?? "arrow";
}

/* ---------- stat card ---------- */

const TONES = {
  maroon: { chip: "bg-brand-100 text-brand-800", bar: "bg-brand-700" },
  green: { chip: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-600" },
  amber: { chip: "bg-amber-100 text-amber-700", bar: "bg-amber-500" },
  red: { chip: "bg-red-100 text-red-700", bar: "bg-red-600" },
  blue: { chip: "bg-sky-100 text-sky-700", bar: "bg-sky-600" },
} as const;
export type Tone = keyof typeof TONES;

export function StatCard({ label, value, sub, icon, tone = "maroon", href }: {
  label: string; value: string; sub?: string; icon: IconName; tone?: Tone; href?: string;
}) {
  const t = TONES[tone];
  const inner = (
    <>
      <span className={`absolute inset-x-0 top-0 h-1 ${t.bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
        </div>
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${t.chip}`}>
          <Icon name={icon} />
        </span>
      </div>
    </>
  );
  const cls = "relative block overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm";
  return href ? (
    <Link href={href} className={`${cls} transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md`}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/* ---------- card shell ---------- */

export function Panel({ title, hint, children, className = "" }: { title: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

/* ---------- charts (plain SVG / CSS, rendered on the server) ---------- */

/** 125000 -> "125k" */
export const compact = (n: number) => (n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${+(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

export function BarChart({ data, aLabel, bLabel }: {
  data: { label: string; a: number; b: number }[]; aLabel: string; bLabel: string;
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.a, d.b]));
  return (
    <div>
      <div className="flex h-48 items-end gap-2 border-b border-zinc-200 sm:gap-4" role="img" aria-label={`${aLabel} and ${bLabel} by month`}>
        {data.map((d) => (
          <div key={d.label} className="flex h-full flex-1 items-end justify-center gap-1">
            <div className="flex h-full w-full max-w-7 flex-col justify-end" title={`${aLabel}: PKR ${d.a.toLocaleString("en-PK")}`}>
              <span className="mb-0.5 text-center text-[10px] text-zinc-400">{d.a ? compact(d.a) : ""}</span>
              <div className="bar-grow rounded-t-md bg-brand-200" style={{ height: `${(d.a / max) * 82}%` }} />
            </div>
            <div className="flex h-full w-full max-w-7 flex-col justify-end" title={`${bLabel}: PKR ${d.b.toLocaleString("en-PK")}`}>
              <span className="mb-0.5 text-center text-[10px] font-medium text-brand-800">{d.b ? compact(d.b) : ""}</span>
              <div className="bar-grow rounded-t-md bg-brand-700" style={{ height: `${(d.b / max) * 82}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-4">
        {data.map((d) => (
          <p key={d.label} className="flex-1 text-center text-xs text-zinc-500">{d.label}</p>
        ))}
      </div>
      <div className="mt-4 flex gap-5 text-xs text-zinc-600">
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-brand-200" />{aLabel}</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-brand-700" />{bLabel}</span>
      </div>
    </div>
  );
}

export type Segment = { label: string; value: number; color: string };

export function Donut({ segments, centre, sub, empty = "No data yet" }: { segments: Segment[]; centre: string; sub?: string; empty?: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="relative size-36 shrink-0">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="#e9e2d3" strokeWidth="16" />
          {total > 0 &&
            segments.filter((s) => s.value > 0).map((s) => {
              const len = (s.value / total) * c;
              const el = (
                <circle key={s.label} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="16"
                  strokeDasharray={`${Math.max(len - 1.5, 0)} ${c - Math.max(len - 1.5, 0)}`} strokeDashoffset={-offset} />
              );
              offset += len;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <p className="text-xl font-semibold text-zinc-900">{total > 0 ? centre : "–"}</p>
          <p className="text-[11px] text-zinc-500">{total > 0 ? sub : empty}</p>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-zinc-700">
            <i className="size-2.5 rounded-full" style={{ background: s.color }} />
            <span className="w-16">{s.label}</span>
            <span className="font-medium text-zinc-900">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HBars({ rows, empty = "Nothing to show yet." }: { rows: { label: string; value: number; href?: string }[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-zinc-500">{empty}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3 text-sm">
          <span className="truncate text-zinc-600">{r.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-brand-50">
            <span className="hbar-grow block h-full rounded-full bg-gradient-to-r from-brand-700 to-[#d9541e]" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="text-right font-medium text-zinc-900">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** Seven slim columns: percent present per day. pct === null means attendance was not marked. */
export function WeekBars({ days }: { days: { label: string; pct: number | null }[] }) {
  return (
    <div>
      <div className="flex h-36 items-end gap-3 border-b border-zinc-200">
        {days.map((d) => (
          <div key={d.label} className="mx-auto flex h-full w-full max-w-12 flex-1 flex-col justify-end" title={d.pct === null ? "Not marked" : `${d.pct}% present`}>
            <span className="mb-0.5 text-center text-[10px] text-zinc-500">{d.pct === null ? "" : `${d.pct}%`}</span>
            <div
              className={`bar-grow rounded-t-md ${d.pct === null ? "bg-zinc-200" : "bg-emerald-500"}`}
              style={{ height: d.pct === null ? "4%" : `${Math.max(d.pct, 3) * 0.82}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {days.map((d) => (
          <p key={d.label} className="flex-1 text-center text-xs text-zinc-500">{d.label}</p>
        ))}
      </div>
    </div>
  );
}
