/**
 * Spike only (C7): the brand look both libraries are styled with, so the
 * comparison measures the library, not the styling. Values are the tokens of
 * the existing Dialog and Select. Motion is per library: `radix/motion.ts`,
 * `rac/motion.ts`.
 */
export const look = {
  overlay:
    "fixed inset-0 z-overlay flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm",
  dialog:
    "relative w-full max-w-lg rounded-3xl border border-line bg-surface p-6 shadow-card outline-none sm:p-7",
  panel:
    "z-dropdown min-w-56 rounded-xl border border-line bg-surface p-1.5 shadow-card outline-none",
  item: "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-small font-medium text-ink-soft outline-none",
  trigger:
    "flex items-center gap-3 rounded-xl border border-line bg-bg px-3 py-2.5 text-left text-small font-semibold text-ink",
  input:
    "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-small text-ink outline-none focus:shadow-focus",
  radio:
    "flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line",
  radioDot: "size-2.5 rounded-full bg-coral",
  day: "flex size-10 items-center justify-center rounded-full text-small font-medium text-ink outline-none",
  daySelected: "bg-coral-gradient font-semibold text-white",
  weekday: "text-caption font-semibold text-ink-soft",
  caption: "text-body font-semibold text-ink",
} as const;
