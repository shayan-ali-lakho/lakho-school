"use client";

import { useActionState, useState, type ReactNode } from "react";
import type { FormState } from "@/lib/form";
import { Notice } from "@/components/notice";
import { btnPrimary } from "@/components/ui";

/**
 * Form wired to a server action. A failure opens a dialog with the message, and the
 * button is disabled while submitting. On success the action redirects (the next page shows a success dialog).
 */
export function ActionForm({
  action,
  submitLabel,
  children,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [tries, setTries] = useState(0);

  return (
    <form
      action={(fd) => {
        setTries((n) => n + 1);
        formAction(fd);
      }}
      className="space-y-4"
    >
      {children}
      {state?.error && (
        <Notice key={tries} kind="error">
          {state.error}
        </Notice>
      )}
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
