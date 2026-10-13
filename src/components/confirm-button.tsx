"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/modal";
import { btnDangerSolid, btnSecondary } from "@/components/ui";

/**
 * A button that asks "are you sure?" in a dialog before submitting its form.
 * Place it inside a <form>; confirming submits that form.
 */
export function ConfirmButton({
  label,
  title,
  message,
  confirmLabel = "Yes, delete",
  className,
}: {
  label: string;
  title: string;
  message: string;
  confirmLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={btn} type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        tone="neutral"
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>
              Cancel
            </button>
            <button
              type="button"
              className={btnDangerSolid}
              onClick={() => {
                setOpen(false);
                btn.current?.form?.requestSubmit();
              }}
            >
              {confirmLabel}
            </button>
          </>
        }
      >
        {message}
      </Modal>
    </>
  );
}
