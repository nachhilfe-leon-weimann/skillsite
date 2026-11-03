"use client";

import { cn } from "@skillsite/ui/utils/cn";
import type { FieldDef, FieldValue } from "@/lib/booking/fields";

/**
 * Pill choices. `multiple` toggles between a multi-select (value is a string[],
 * `aria-pressed`) and a single-select (value is a string, radio semantics).
 */
export function ChipsField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  const toggle = (optionValue: string) => {
    if (field.multiple) {
      onChange(
        selected.includes(optionValue)
          ? selected.filter((entry) => entry !== optionValue)
          : [...selected, optionValue],
      );
    } else {
      onChange(selected[0] === optionValue ? "" : optionValue);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-small font-semibold text-ink">{field.label}</p>
      <div
        className="flex flex-wrap gap-2"
        role={field.multiple ? "group" : "radiogroup"}
        aria-label={field.label}
        aria-required={field.required || undefined}
      >
        {field.options?.map((option) => {
          const active = selected.includes(option.value);
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              role={field.multiple ? undefined : "radio"}
              aria-pressed={field.multiple ? active : undefined}
              aria-checked={field.multiple ? undefined : active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-small font-semibold transition-colors",
                active
                  ? "border-coral bg-coral text-white"
                  : "border-line bg-bg text-ink hover:border-coral",
              )}
            >
              {Icon ? (
                <span
                  aria-hidden
                  className={cn(
                    "text-chip-icon",
                    active ? "text-on-accent-75" : "text-coral",
                  )}
                >
                  <Icon className="size-5" />
                </span>
              ) : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
