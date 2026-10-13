"use client";

import { useSearchParams } from "next/navigation";
import { Notice } from "@/components/notice";

/**
 * Turns the ?ok=... and ?error=... parts of the address (set by actions after they redirect)
 * into a success or failure dialog. Closing the dialog removes them from the address.
 */
export function Flash() {
  const params = useSearchParams();
  const ok = params.get("ok");
  const error = params.get("error");
  const receipt = params.get("receipt");
  if (!ok && !error) return null;

  return (
    <>
      {error && (
        <Notice key={`e-${error}`} kind="error" clear={["error"]}>
          {error}
        </Notice>
      )}
      {ok && !error && (
        <Notice
          key={`o-${ok}`}
          kind="success"
          clear={["ok", "receipt", "saved"]}
          link={receipt ? { href: `/portal/fees/receipt/${receipt}`, label: "View receipt" } : undefined}
        >
          {ok}
        </Notice>
      )}
    </>
  );
}

