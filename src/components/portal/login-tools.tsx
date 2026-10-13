"use client";

import { useActionState } from "react";
import { generateLogin, type LoginState } from "@/app/portal/admin/users/actions";

/** "Generate new password" button. Shows the login once so the admin can hand it over. */
export function LoginTools({ userId, email }: { userId: string; email: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(generateLogin, undefined);

  return (
    <div className="space-y-3 text-sm">
      <form action={action}>
        <input type="hidden" name="userId" value={userId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 disabled:opacity-60"
        >
          {pending ? "Generating..." : "Generate new password"}
        </button>
      </form>
      {state?.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-red-700">
          {state.error}
        </p>
      )}
      {state?.password && (
        <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <p className="font-medium text-emerald-900">New login. Write it down now: it will not be shown again.</p>
          <dl className="mt-2 grid grid-cols-[5rem_1fr] gap-y-1">
            <dt className="text-zinc-600">Email</dt>
            <dd className="select-all font-mono">{state.email ?? email}</dd>
            <dt className="text-zinc-600">Password</dt>
            <dd className="select-all font-mono text-base font-semibold">{state.password}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
