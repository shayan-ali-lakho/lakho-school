"use client";

import { useState } from "react";
import { recordPayment } from "@/app/portal/fees/actions";
import { Modal } from "@/components/modal";
import { btnPrimary, btnSecondary, btnSm } from "@/components/ui";
import { PAYMENT_METHODS } from "@/lib/finance";

/** "Receive" button that opens a small dialog to record a payment. */
export function ReceiveFee({ invoiceId, balance, studentName, back }: { invoiceId: string; balance: number; studentName: string; back: string }) {
  const [open, setOpen] = useState(false);
  const field = "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${btnPrimary} ${btnSm}`}>
        Receive
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Receive payment from ${studentName}`} tone="neutral">
        <form action={recordPayment} className="mt-3 space-y-3 text-left">
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <input type="hidden" name="back" value={back} />
          <div>
            <label htmlFor={`amt-${invoiceId}`} className="block text-sm font-medium text-zinc-700">
              Amount (PKR). Balance due: {balance.toLocaleString("en-PK")}
            </label>
            <input id={`amt-${invoiceId}`} name="amount" type="number" min={1} max={balance} defaultValue={balance} required className={field} />
          </div>
          <div>
            <label htmlFor={`m-${invoiceId}`} className="block text-sm font-medium text-zinc-700">Payment method</label>
            <select id={`m-${invoiceId}`} name="method" className={field}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary}>Receive payment</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
