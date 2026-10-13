/** Shared button styles so every Add / Save / Delete looks the same. */
const base = "inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60";
export const btnPrimary = `${base} bg-emerald-700 text-white hover:bg-emerald-800`;
export const btnSecondary = `${base} border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100`;
export const btnDanger = `${base} border border-red-300 bg-white text-red-700 hover:bg-red-50`;
export const btnDangerSolid = `${base} bg-red-700 text-white hover:bg-red-800`;
/** Compact versions for table rows. */
export const btnSm = "!px-3 !py-1.5";
