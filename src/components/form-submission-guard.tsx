"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Modal } from "@/components/modal";

/** Global fallback for native form posts and server-action submissions.
 * Forms that handle AJAX themselves can dispatch 'school:form-settled' on completion.
 */
export function FormSubmissionGuard() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let activeForm: HTMLFormElement | null = null;
    const stop = () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
      activeForm?.removeAttribute("aria-busy");
      activeForm = null;
      setBusy(false);
    };
    const submit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || event.defaultPrevented) return;
      if (form.dataset.noSubmissionLoader === "true") return;
      if ((form.getAttribute("method") ?? "get").toLowerCase() === "get") return;
      // Only valid forms should trigger the blocking loader.
      if (!form.checkValidity()) return;
      stop();
      activeForm = form;
      form.setAttribute("aria-busy", "true");
      setFailure(null);
      setBusy(true);
      timer = setTimeout(() => {
        stop();
        setFailure("The submission is taking longer than expected. Please check whether your changes were saved before trying again.");
      }, 30000);
    };
    const settled = (event: Event) => {
      stop();
      const detail = (event as CustomEvent<{ error?: string }>).detail;
      if (detail?.error) setFailure(detail.error);
    };
    const rejected = (event: PromiseRejectionEvent) => {
      if (!activeForm) return;
      stop();
      setFailure(event.reason instanceof Error ? event.reason.message : "The submission failed. Please try again.");
    };
    const failed = (event: ErrorEvent) => {
      if (!activeForm) return;
      stop();
      setFailure(event.message || "The submission failed. Please try again.");
    };
    const navigate = () => stop();
    document.addEventListener("submit", submit, true);
    window.addEventListener("school:form-settled", settled);
    window.addEventListener("unhandledrejection", rejected);
    window.addEventListener("error", failed);
    window.addEventListener("pagehide", navigate);
    return () => {
      stop();
      document.removeEventListener("submit", submit, true);
      window.removeEventListener("school:form-settled", settled);
      window.removeEventListener("unhandledrejection", rejected);
      window.removeEventListener("error", failed);
      window.removeEventListener("pagehide", navigate);
    };
  }, [pathname, query]);

  return <>
    {busy && <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/40 backdrop-blur-[3px]" role="status" aria-live="polite" aria-label="Submitting form">
      <div className="flex min-w-56 flex-col items-center gap-3 rounded-2xl bg-white p-7 text-center shadow-2xl">
        <span className="nav-spinner size-10 rounded-full border-4 border-indigo-100 border-t-indigo-600" aria-hidden="true" />
        <strong className="text-sm text-slate-800">Please wait…</strong>
        <span className="text-xs text-slate-500">Saving your information</span>
      </div>
    </div>}
    <Modal open={failure !== null} onClose={() => setFailure(null)} title="Submission problem" tone="error"
      footer={<button type="button" onClick={() => setFailure(null)} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white">OK</button>}>
      {failure}
    </Modal>
  </>;
}
