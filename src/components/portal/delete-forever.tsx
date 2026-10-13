"use client";

import { deleteUserPermanently } from "@/app/portal/admin/users/actions";

/** "Delete permanently" button that asks for confirmation first. */
export function DeleteForever({ userId, name, back, className }: { userId: string; name: string; back: string; className?: string }) {
  return (
    <form
      action={deleteUserPermanently}
      className="inline"
      onSubmit={(e) => {
        if (!window.confirm(`Permanently delete ${name}? This removes their login and all their records, and cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="back" value={back} />
      <button type="submit" className={className ?? "text-red-700 hover:underline"}>
        Delete permanently
      </button>
    </form>
  );
}
