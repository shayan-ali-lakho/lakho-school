"use client";

import { useState, useTransition, type FormEvent } from "react";
import { addFee, type AddFeeState } from "@/app/portal/fees/actions";
import { Notice } from "@/components/notice";
import { btnPrimary } from "@/components/ui";
import { FEE_TYPE_LABELS, FEE_TYPES, PAYMENT_METHODS, type FeeTypeValue } from "@/lib/finance";

export type FeeStudent = { id: string; name: string; roll: string; classId: string; classLabel: string; monthlyFee: number };
export type FeeClass = { id: string; label: string };

const input =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600";
const label = "block text-sm font-medium text-zinc-700";

function Fields({ students, classes, defaultMonth, pending }: { students: FeeStudent[]; classes: FeeClass[]; defaultMonth: string; pending: boolean }) {
  const [type, setType] = useState<FeeTypeValue>("MONTHLY");
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paid, setPaid] = useState("");
  const [paidTouched, setPaidTouched] = useState(false);

  const list = classId ? students.filter((s) => s.classId === classId) : students;

  const suggest = (t: FeeTypeValue, sid: string) => {
    const st = students.find((s) => s.id === sid);
    const next = t === "MONTHLY" && st && st.monthlyFee > 0 ? String(st.monthlyFee) : "";
    setAmount(next);
    if (!paidTouched) setPaid(next);
  };

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className={label}>Fee type</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {FEE_TYPES.map((t) => (
            <label
              key={t}
              className={`cursor-pointer rounded-md border px-4 py-2 text-sm ${
                type === t ? "border-emerald-600 bg-emerald-50 font-medium text-emerald-800" : "border-zinc-300 bg-white hover:bg-zinc-50"
              }`}
            >
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                onChange={() => {
                  setType(t);
                  suggest(t, studentId);
                }}
                className="sr-only"
              />
              {FEE_TYPE_LABELS[t]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="month" className={label}>Month</label>
          <input id="month" name="month" type="month" required defaultValue={defaultMonth} className={input} />
        </div>
        <div>
          <label htmlFor="classFilter" className={label}>Class (to narrow the student list)</label>
          <select
            id="classFilter"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setStudentId("");
            }}
            className={input}
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="studentId" className={label}>Student <span className="text-red-600">*</span></label>
        <select
          id="studentId"
          name="studentId"
          required
          value={studentId}
          onChange={(e) => {
            setStudentId(e.target.value);
            suggest(type, e.target.value);
          }}
          className={input}
        >
          <option value="" disabled>Choose a student...</option>
          {list.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · Roll {s.roll} · {s.classLabel}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className={label}>Fee amount (PKR) <span className="text-red-600">*</span></label>
          <input
            id="amount"
            name="amount"
            type="number"
            min={1}
            required
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (!paidTouched) setPaid(e.target.value);
            }}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="paid" className={label}>Amount received now (PKR)</label>
          <input
            id="paid"
            name="paid"
            type="number"
            min={0}
            value={paid}
            onChange={(e) => {
              setPaid(e.target.value);
              setPaidTouched(true);
            }}
            className={input}
          />
          <p className="mt-1 text-xs text-zinc-500">Enter 0 if nothing was paid yet. Any rest stays due.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="method" className={label}>Payment method</label>
          <select id="method" name="method" className={input} defaultValue="Cash">
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="note" className={label}>Note (optional)</label>
          <input id="note" name="note" maxLength={200} className={input} />
        </div>
      </div>

      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Adding..." : "+ Add fee"}
      </button>
    </div>
  );
}

/** Add-fee form. Shows a success or failure dialog after each submit. */
export function AddFeeForm({ students, classes, defaultMonth }: { students: FeeStudent[]; classes: FeeClass[]; defaultMonth: string }) {
  const [state, setState] = useState<AddFeeState>(undefined);
  const [pending, start] = useTransition();
  // Bumped after a successful add so the fields start empty for the next fee.
  const [fresh, setFresh] = useState(0);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    start(async () => {
      const result = await addFee(undefined, data);
      setState(result);
      if (result?.ok) setFresh((n) => n + 1);
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <Fields key={fresh} students={students} classes={classes} defaultMonth={defaultMonth} pending={pending} />
      {state?.error && <Notice key={state.key} kind="error">{state.error}</Notice>}
      {state?.ok && (
        <Notice
          key={state.key}
          kind="success"
          link={state.ok.receiptId ? { href: `/portal/fees/receipt/${state.ok.receiptId}`, label: "View receipt" } : { href: "/portal/fees", label: "View fees" }}
        >
          {state.ok.message}
        </Notice>
      )}
    </form>
  );
}
