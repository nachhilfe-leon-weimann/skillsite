import type { BookingEventKey } from "./config";
import type { FieldValue } from "./fields";
import { invalidFieldLabels } from "./schema";

/**
 * Best-effort E.164 for Cal.com, which wants international numbers, not national
 * ones. Assumes German numbers: a leading `0` is the national trunk prefix and
 * becomes `+49`, `00` is the international prefix -> `+`, and a number already in
 * `+...` form is kept as-is.
 */
export function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+49${digits.slice(1)}`;
  return `+49${digits}`;
}

/**
 * Validate a submission's values against the event's schema (`schema.ts`).
 * Returns the labels of the fields that are missing or invalid - an empty array
 * means valid. One source of truth: the client uses it live (submit gate +
 * "still open" hint) and the server action runs the same schema before
 * forwarding anything to Cal.com.
 */
export function validateBookingValues(
  event: BookingEventKey,
  values: Record<string, FieldValue>,
): string[] {
  return invalidFieldLabels(event, values);
}
