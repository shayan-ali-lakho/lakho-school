"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createUser, type CreateUserState } from "@/app/portal/admin/users/actions";
import { Field, SelectField } from "@/components/fields";

/** Create-account form. After success it shows the login once, ready to hand over. */
export function NewUserForm({ roles }: { roles: { value: string; label: string }[] }) {
  const [state, action, pending] = useActionState<CreateUserState, FormData>(createUser, undefined);

  if (state?.created) {
    const c = state.created;
    return (
      <div role="status" className="space-y-4">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-medium text-emerald-900">
            Account created for {c.name}. Write the login down now: the password will not be shown again.
          </p>
          <dl className="mt-3 grid grid-cols-[6rem_1fr] gap-y-1">
            <dt className="text-zinc-600">Username</dt>
            <dd className="select-all font-mono text-base font-semibold">{c.login}</dd>
            <dt className="text-zinc-600">Password</dt>
            <dd className="select-all font-mono text-base font-semibold">{c.password}</dd>
          </dl>
        </div>
        {/* A full page load clears the form state, so a plain anchor is intended here. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/portal/admin/users/new" className="text-sm text-emerald-700 hover:underline">
          Create another account
        </a>
        <span className="mx-2 text-zinc-300">|</span>
        <Link href="/portal/admin/users" className="text-sm text-emerald-700 hover:underline">
          Back to all accounts
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <Field label="Full name" name="name" required />
      <Field
        label="Username or email (used to sign in)"
        name="email"
        required
        autoComplete="off"
        hint="A username such as ali.raza works without an email address."
      />
      <SelectField label="Role" name="role" required placeholder="Choose a role" options={roles} />
      <Field
        label="Password"
        name="password"
        type="text"
        autoComplete="off"
        hint="At least 8 characters. Leave blank to generate one automatically."
      />
      {state?.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}
