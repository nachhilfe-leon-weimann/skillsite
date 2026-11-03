import type { LucideIcon } from "lucide-react";

/**
 * The booking domain is schema-driven: every event declares its fields once,
 * and the form (rendering), the validation engine and the Cal.com mapping all
 * read from that single declaration. This module holds the event-agnostic field
 * primitives; the concrete per-event field lists live in `config.ts`.
 */

/** How a field is rendered in the booking form. */
export type FieldKind =
  "text" | "email" | "tel" | "textarea" | "chips" | "radio";

/** A choice for `chips` / `radio` fields. */
export type FieldOption = {
  /** Stored value. For Cal-bound choices this is the exact value Cal expects. */
  value: string;
  label: string;
  /** Optional glyph shown on a chip (e.g. subject icons). */
  icon?: LucideIcon;
  /** Optional helper line under a radio label. */
  hint?: string;
};

/**
 * Where a field's value goes in the Cal.com v2 booking body. This is the only
 * place the Cal wire-format leaks into the schema; the form and the action stay
 * unaware of it and just move opaque values around.
 */
export type CalTarget =
  | { to: "attendeeName"; part: "first" | "last" }
  | { to: "attendee"; field: "email" | "phoneNumber" }
  | { to: "bookingField"; slug: string }
  | { to: "location" };

/** A form field, declared once and reused for render, validation and mapping. */
export type FieldDef = {
  /** Internal state key, e.g. `firstName`. */
  key: string;
  kind: FieldKind;
  label: string;
  /** Compact label used in the "still open" hint; defaults to `label`. */
  shortLabel?: string;
  placeholder?: string;
  /** Muted suffix after the label, e.g. "(optional)". */
  hint?: string;
  /** Layout hint: two consecutive `half` fields render side by side. */
  half?: boolean;
  autoComplete?: string;
  /** Choices for `chips` / `radio`. */
  options?: FieldOption[];
  /** `chips` only: allow several selections (value becomes a `string[]`). */
  multiple?: boolean;
  maxLength?: number;
  required?: boolean;
  /** Extra format check applied once the field is non-empty. */
  format?: "email" | "phone";
  target: CalTarget;
};

/** Field value in form state: most fields hold a string, multi-chips a string[]. */
export type FieldValue = string | string[];

export const isMultiValue = (
  value: FieldValue | undefined,
): value is string[] => Array.isArray(value);

/** Empty means "required and unfilled": blank string or empty selection. */
export function isFieldEmpty(value: FieldValue | undefined): boolean {
  if (value == null) return true;
  return isMultiValue(value) ? value.length === 0 : value.trim() === "";
}

/** The default empty value matching a field's shape. */
export const emptyValueFor = (field: FieldDef): FieldValue =>
  field.kind === "chips" && field.multiple ? [] : "";
