"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Lightweight entrance on route changes; avoids remounting server content or resetting forms. */
export function PageMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    setActive(true);
    const timer = window.setTimeout(() => setActive(false), 320);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  return <div className={active ? "portal-page-motion portal-page-enter" : "portal-page-motion"}>{children}</div>;
}
