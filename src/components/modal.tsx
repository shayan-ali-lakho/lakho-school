"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Centered dialog with a dark backdrop. Escape or a click outside closes it. */
export function Modal({
  open,
  onClose,
  title,
  tone = "neutral",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  tone?: "success" | "error" | "neutral";
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const icon = tone === "success" ? "✓" : tone === "error" ? "!" : "?";
  const ring =
    tone === "success" ? "bg-emerald-100 text-emerald-700" : tone === "error" ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role={tone === "error" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl outline-none"
      >
        <div className="flex items-start gap-4">
          <span aria-hidden className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${ring}`}>
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            {children && <div className="mt-1 text-sm text-zinc-600">{children}</div>}
          </div>
        </div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
