"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Modal } from "@/components/modal";
import { btnPrimary, btnSecondary } from "@/components/ui";

/**
 * Pops up a success or failure message. Use it where a banner used to be:
 * it opens by itself when it appears. `clear` lists URL parameters (such as "error")
 * to remove from the address when the message is closed, so a refresh does not show it again.
 */
export function Notice({
  kind,
  children,
  clear = [],
  link,
}: {
  kind: "success" | "error";
  children: ReactNode;
  clear?: string[];
  link?: { href: string; label: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
    if (clear.length > 0) {
      const url = new URL(window.location.href);
      clear.forEach((k) => url.searchParams.delete(k));
      router.replace(url.pathname + url.search, { scroll: false });
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      tone={kind}
      title={kind === "success" ? "Done" : "That did not work"}
      footer={
        <>
          {link && (
            <Link href={link.href} onClick={close} className={btnSecondary}>
              {link.label}
            </Link>
          )}
          <button type="button" onClick={close} autoFocus className={btnPrimary}>
            OK
          </button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
