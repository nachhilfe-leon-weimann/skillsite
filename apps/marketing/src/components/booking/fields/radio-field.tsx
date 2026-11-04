"use client";

import { RadioGroup } from "@skillsite/ui/forms/radio-group";
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
    <RadioGroup
      label={field.label}
      required={field.required}
      options={field.options ?? []}
      value={value}
      onChange={onChange}
    />
  );
}
