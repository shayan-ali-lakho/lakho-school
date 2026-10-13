"use client";

import { useActionState, type ReactNode } from "react";

export type PublicFormState = { error?: string; success?: string } | undefined;

const inputClass =
  "mt-1 w-full rounded-sm border border-paper-rule bg-white px-3 py-2.5 text-lg text-ink transition-shadow focus:border-ink focus:outline-none focus:ring-2 focus:ring-saffron/40";

export function PField({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-ink-soft">
        {label}
        {required && <span className="text-pen"> *</span>}
      </label>
      <input id={name} name={name} type={type} required={required} autoComplete={autoComplete} className={inputClass} />
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}

export function PSelect({
  label,
  name,
  required,
  options,
}: {
  label: string;
  name: string;
  required?: boolean;
  options: string[];
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-ink-soft">
        {label}
        {required && <span className="text-pen"> *</span>}
      </label>
      <select id={name} name={name} required={required} defaultValue="" className={inputClass}>
        <option value="" disabled>
          Choose…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function PTextarea({ label, name, required, rows = 4 }: { label: string; name: string; required?: boolean; rows?: number }) {
  return (
    <div>
      <label htmlFor={name} className="block text-ink-soft">
        {label}
        {required && <span className="text-pen"> *</span>}
      </label>
      <textarea id={name} name={name} required={required} rows={rows} className={inputClass} />
    </div>
  );
}

/** Public-site form wired to a server action; swaps to a thank-you note after success. */
export function PublicForm({
  action,
  submitLabel,
  children,
}: {
  action: (prev: PublicFormState, formData: FormData) => Promise<PublicFormState>;
  submitLabel: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  if (state?.success) {
    return (
      <div role="status" className="rise rounded-sm border border-board/30 bg-board/5 p-6">
        <p className="font-display text-2xl font-semibold text-board">Thank you</p>
        <p className="mt-2 text-lg leading-relaxed">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Honeypot: real visitors never see or fill this */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {children}
      {state?.error && (
        <p role="alert" className="rounded-sm border border-pen/30 bg-pen/5 px-4 py-3 text-pen">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-ink px-6 py-3 text-lg font-medium text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2a3753] hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {pending ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
