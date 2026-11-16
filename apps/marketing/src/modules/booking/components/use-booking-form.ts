"use client";

import { useMemo, useState } from "react";

import {
  bookingEvents,
  type BookingDraft,
  type BookingEventKey,
} from "../model/config";
import { emptyValueFor, type FieldValue } from "../model/fields";
import { validateBookingValues } from "../model/validation";

/** Initial form state: each field's declared default, otherwise empty. */
function initialValues(
  event: BookingEventKey,
  initialSubject?: string,
): Record<string, FieldValue> {
  const values: Record<string, FieldValue> = {};
  for (const field of bookingEvents[event].fields) {
    let value = field.defaultValue ?? emptyValueFor(field);
    if (
      field.kind === "chips" &&
      initialSubject &&
      field.options?.some((option) => option.value === initialSubject)
    ) {
      value = field.multiple ? [initialSubject] : initialSubject;
    }
    values[field.key] = value;
  }
  return values;
}

/**
 * Form state for a schema-driven booking event: holds the field values plus the
 * anti-spam honeypot and mount timestamp, validates live against the event
 * schema, and assembles the `BookingDraft` the booker sends to the server action.
 */
export function useBookingForm(
  event: BookingEventKey,
  initialSubject?: string,
) {
  const [values, setValues] = useState(() =>
    initialValues(event, initialSubject),
  );
  const [honeypot, setHoneypot] = useState("");
  // Mount time (lazy initializer runs once) on the monotonic clock; the booker
  // turns it into the elapsed fill time the server time-trap checks.
  const [formLoadedAt] = useState(() => performance.now());

  const setValue = (key: string, value: FieldValue) =>
    setValues((current) => ({ ...current, [key]: value }));

  // Single source of truth for the submit gate and the "still open" hint.
  const missing = useMemo(
    () => validateBookingValues(event, values),
    [event, values],
  );

  const buildDraft = (slot: string, duration?: number): BookingDraft => ({
    event,
    slot,
    duration,
    values,
    honeypot,
    formLoadedAt,
  });

  return {
    values,
    setValue,
    honeypot,
    setHoneypot,
    missing,
    canSubmit: missing.length === 0,
    buildDraft,
  };
}
