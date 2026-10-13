import { deleteUserPermanently } from "@/app/portal/admin/users/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { btnDanger, btnSm } from "@/components/ui";

/** "Delete permanently" button that asks for confirmation in a dialog first. */
export function DeleteForever({ userId, name, back, className }: { userId: string; name: string; back: string; className?: string }) {
  return (
    <form action={deleteUserPermanently} className="inline">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="back" value={back} />
      <ConfirmButton
        label="Delete permanently"
        title={`Delete ${name} permanently?`}
        message="This removes their login and all their records. It cannot be undone."
        confirmLabel="Yes, delete permanently"
        className={className ?? `${btnDanger} ${btnSm}`}
      />
    </form>
  );
}
