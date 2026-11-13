"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Shows a loading bar across the top and blocks the page (with a spinner) while the portal moves to
 * another page. It starts when an in-portal link is clicked or a filter form is submitted, and stops
 * when the address changes.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = `${pathname}${search ? `?${search}` : ""}`;
  // The address we left when a navigation began. Same as `here` = still loading; different = arrived.
  const [from, setFrom] = useState<string | null>(null);
  const loading = from !== null && from === here;
  const arrived = from !== null && from !== here;
  const state = loading ? "loading" : arrived ? "done" : "idle";

  useEffect(() => {
    if (from === null) return;
    // Hide the bar shortly after arriving; never leave the page blocked if something goes wrong.
    const t = setTimeout(() => setFrom(null), arrived ? 600 : 15000);
    return () => clearTimeout(t);
  }, [from, arrived]);

  useEffect(() => {
    const start = () => setFrom(`${window.location.pathname}${window.location.search}`);

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.startsWith("/portal")) return;
      if (`${url.pathname}${url.search}` === `${window.location.pathname}${window.location.search}`) return;
      start();
    };

    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null;
      if (!form || e.defaultPrevented) return;
      // Capture phase: Next's Link calls preventDefault, so we listen before it runs.
      // Filter forms (GET) navigate to a new address; server-action forms are handled by their own buttons.
      if ((form.getAttribute("method") ?? "").toLowerCase() === "get") start();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[80]" aria-hidden="true">
        <div className="nav-bar" data-state={state} style={state === "idle" ? { width: 0, opacity: 0 } : undefined} />
      </div>
      {loading && (
        <div className="nav-block fixed inset-0 z-[70] grid cursor-wait place-items-center bg-white/55 backdrop-blur-[2px]" role="status" aria-live="polite">
          <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white px-5 py-3 text-sm font-medium text-brand-800 shadow-lg">
            <span className="nav-spinner size-5 rounded-full border-[3px] border-brand-100 border-t-brand-700" />
            Loading…
          </div>
        </div>
      )}
    </>
  );
}
