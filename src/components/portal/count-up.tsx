"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Shows a value such as "PKR 184,500" or "281 of 301" and counts the first number up from zero.
 * The server renders the final value, so nothing is missing without JavaScript.
 */
export function CountUp({ value }: { value: string }) {
  const el = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const node = el.current;
    const m = value.match(/^(\D*?)(\d[\d,]*)(.*)$/);
    if (!node || !m) return;
    const target = Number(m[2].replace(/,/g, ""));
    if (!Number.isFinite(target) || target < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const start = performance.now();
    const duration = 900;
    let raf = 0;
    const paint = (n: number) => {
      node.textContent = `${m[1]}${n.toLocaleString("en-PK")}${m[3]}`;
    };
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      if (t < 1) {
        paint(Math.round(target * (1 - Math.pow(1 - t, 3))));
        raf = requestAnimationFrame(tick);
      } else {
        node.textContent = value;
      }
    };
    paint(0);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      node.textContent = value;
    };
  }, [value]);

  return <span ref={el}>{value}</span>;
}
