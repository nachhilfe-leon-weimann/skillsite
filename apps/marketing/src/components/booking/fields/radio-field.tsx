"use client";

import { cn } from "@skillsite/ui/utils/cn";
import type { FieldDef } from "@/lib/booking/fields";

/** Single-choice radio group as selectable rows (e.g. the platform choice). */
export function RadioField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-small font-semibold text-ink">{field.label}</p>
      <div
        role="radiogroup"
        aria-label={field.label}
        aria-required={field.required || undefined}
        className="grid gap-2 sm:grid-cols-2"
      >
        {field.options?.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-small font-semibold transition-colors",
                active
                  ? "border-coral bg-[color-mix(in_srgb,var(--coral)_8%,transparent)] text-ink"
                  : "border-line bg-bg text-ink hover:border-coral",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  active ? "border-coral" : "border-line",
                )}
              >
                {active ? (
                  <span className="size-2 rounded-full bg-coral" />
                ) : null}
              </span>
              <span className="min-w-0">
                {option.label}
                {option.hint ? (
                  <span className="block text-caption font-normal text-ink-soft">
                    {option.hint}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
