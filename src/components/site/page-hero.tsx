import type { CSSProperties, ReactNode } from "react";

/** Title block shared by the inner public pages. */
export function PageHero({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="notebook relative overflow-hidden border-b border-paper-rule">
      <div aria-hidden className="margin-line absolute inset-y-0 w-px bg-pen/60" />
      <div className="wrap pb-14 pt-12 sm:pt-16">
        <h1 className="rise max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          {title}
        </h1>
        {children && (
          <p
            className="rise mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft"
            style={{ "--d": 150 } as CSSProperties}
          >
            {children}
          </p>
        )}
      </div>
    </section>
  );
}
