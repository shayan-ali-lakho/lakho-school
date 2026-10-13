"use client";

import { useActionState } from "react";
import { setPassword, type PasswordState } from "@/app/portal/admin/users/actions";
import { Notice } from "@/components/notice";
import { btnPrimary } from "@/components/ui";

/** Admin types a password for this account (works for adding or changing one). */
export function LoginTools({ userId }: { userId: string; email?: string }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(setPassword, undefined);

  return (
    <form action={action} className="space-y-3 text-sm">
      <input type="hidden" name="userId" value={userId} />
      <label htmlFor={`pw-${userId}`} className="block text-zinc-600">
        New password (at least 8 characters)
      </label>
      <div className="flex gap-2">
        <input
          id={`pw-${userId}`}
          name="password"
          type="text"
          required
          minLength={8}
          autoComplete="off"
          className="w-64 rounded-md border border-zinc-300 px-3 py-2"
        />
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Saving..." : "Set password"}
        </button>
      </div>
      {state?.error && <Notice key={state.key} kind="error">{state.error}</Notice>}
      {state?.done && <Notice key={state.key} kind="success">Password saved. Give the new password to the user.</Notice>}
    </form>
  );
}
