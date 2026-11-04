"use client";

import { ChoiceChips } from "@skillsite/ui/forms/choice-chips";
import type { FieldDef, FieldValue } from "@/lib/booking/fields";

/**
 * Pill choices. `multiple` toggles between a multi-select (value is a string[],
 * pressed toggles) and a single-select (value is a string, a radio group).
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
  const shared = {
    label: field.label,
    required: field.required,
    options: field.options ?? [],
  };

  return field.multiple ? (
    <ChoiceChips multiple {...shared} value={selected} onChange={onChange} />
  ) : (
    <ChoiceChips {...shared} value={selected[0] ?? ""} onChange={onChange} />
  );
}
