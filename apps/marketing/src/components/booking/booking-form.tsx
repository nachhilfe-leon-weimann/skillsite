"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";

import { Button } from "@skillsite/ui/button";
import { InlineLink, Text } from "@skillsite/ui/typography";
import { cn } from "@skillsite/ui/utils";
import { routes } from "@/lib/routes";
import {
  bookingEvents,
  startsWithinWithdrawalPeriod,
  type BookingDraft,
  type BookingEventKey,
} from "@/lib/booking/config";
import {
  emptyValueFor,
  type FieldDef,
  type FieldValue,
} from "@/lib/booking/fields";
import { useBookingForm } from "@/components/booking/use-booking-form";
import { TextField } from "@/components/booking/fields/text-field";
import { ChipsField } from "@/components/booking/fields/chips-field";
import { RadioField } from "@/components/booking/fields/radio-field";

/** Pick the renderer for a field's kind. */
function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
}) {
  switch (field.kind) {
    case "chips":
      return <ChipsField field={field} value={value} onChange={onChange} />;
    case "radio":
      return (
        <RadioField field={field} value={value as string} onChange={onChange} />
      );
    default:
      return (
        <TextField field={field} value={value as string} onChange={onChange} />
      );
  }
}

/** Group consecutive `half` fields into pairs; everything else stands alone. */
function groupFields(fields: FieldDef[]): FieldDef[][] {
  const groups: FieldDef[][] = [];
  for (const field of fields) {
    const last = groups[groups.length - 1];
    if (field.half && last?.length === 1 && last[0]?.half) last.push(field);
    else groups.push([field]);
  }
  return groups;
}

type BookingFormProps = {
  event: BookingEventKey;
  slotLabel: string;
  /** Exact Cal.com ISO start instant. */
  slotStart: string;
  /** Selected duration in minutes (variable-length events). */
  duration?: number;
  initialSubject?: string;
  onBack: () => void;
  /** Hand the assembled draft to the parent, which sends it. */
  onSubmit: (draft: BookingDraft) => void;
};

/**
 * Schema-driven booking form: renders the event's declared fields, validates
 * live against the same schema the server re-checks, and emits a
 * `BookingDraft`. One component serves every event.
 */
export function BookingForm({
  event,
  slotLabel,
  slotStart,
  duration,
  initialSubject,
  onBack,
  onSubmit,
}: BookingFormProps) {
  const config = bookingEvents[event];
  const {
    values,
    setValue,
    honeypot,
    setHoneypot,
    missing,
    canSubmit,
    buildDraft,
  } = useBookingForm(event, initialSubject);

  const isPaidBooking = event === "nachhilfe";
  const needsEarlyPerformanceConsent =
    isPaidBooking && startsWithinWithdrawalPeriod(slotStart);
  const [earlyPerformanceRequested, setEarlyPerformanceRequested] =
    useState(false);

  const groups = useMemo(() => groupFields(config.fields), [config.fields]);
  const readyToSubmit =
    canSubmit && (!needsEarlyPerformanceConsent || earlyPerformanceRequested);
  const openItems = [
    ...missing,
    ...(needsEarlyPerformanceConsent && !earlyPerformanceRequested
      ? ["Widerrufshinweis"]
      : []),
  ];

  function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!readyToSubmit) return;
    onSubmit({
      ...buildDraft(slotStart, duration),
      agreements: isPaidBooking
        ? { termsAccepted: true, earlyPerformanceRequested }
        : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Honeypot: off-screen, invisible to humans; bots fill it and the booking
          is blocked server-side. Name and label must stay meaningless to
          autofill: browsers ignore autoComplete="off" for anything that reads
          like profile data ("company", "Firma", "website" ...) and would fill it
          for real customers. The data attributes opt out of password managers
          (1Password, LastPass, Bitwarden, Dashlane). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-2500 top-0 h-0 w-0 overflow-hidden"
      >
        <label htmlFor="booking-hp">Dieses Feld bitte leer lassen</label>
        <input
          id="booking-hp"
          name="booking-hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-bwignore
          data-form-type="other"
          value={honeypot}
          onChange={(formEvent) => setHoneypot(formEvent.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Zurück zur Terminwahl"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <div className="min-w-0">
          <Text className="font-semibold text-ink">Deine Daten</Text>
          <span className="mt-0.5 flex items-center gap-1.5 text-small text-ink-soft">
            <Calendar className="size-3.5 shrink-0 text-coral" aria-hidden />
            {slotLabel}
          </span>
        </div>
      </div>

      {/* Fields settle in sequence on first mount. Step kept small (~50ms) so
          the user fills the form, not watches it; mounts once per form step. */}
      {groups.map((group, index) => (
        <div
          key={group[0]?.key ?? index}
          className={cn(
            "motion-safe:animate-rise [--reveal-travel:8px]",
            group.length === 2 && "grid gap-4 sm:grid-cols-2",
          )}
          style={{ animationDelay: `calc(${index} * 50ms)` }}
        >
          {group.map((field) => (
            <FieldControl
              key={field.key}
              field={field}
              value={values[field.key] ?? emptyValueFor(field)}
              onChange={(value) => setValue(field.key, value)}
            />
          ))}
        </div>
      ))}

      {isPaidBooking ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg p-4">
          {needsEarlyPerformanceConsent ? (
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
              <input
                type="checkbox"
                checked={earlyPerformanceRequested}
                onChange={(formEvent) =>
                  setEarlyPerformanceRequested(formEvent.target.checked)
                }
                className="mt-1 size-4 shrink-0 accent-coral"
                required
              />
              <span>
                Der Unterricht darf vor Ablauf der 14-tägigen Widerrufsfrist
                beginnen. Mir ist bekannt, dass mein Widerrufsrecht nach
                vollständiger Durchführung der gebuchten Stunde erlischt.
              </span>
            </label>
          ) : null}
          <Text tone="muted" className="text-sm">
            Mit Klick auf „Zahlungspflichtig buchen“ akzeptierst du die{" "}
            <InlineLink href={routes.agb}>AGB</InlineLink>. Informationen zur
            Datenverarbeitung findest du in der{" "}
            <InlineLink href={routes.datenschutz}>
              Datenschutzerklärung
            </InlineLink>
            .
          </Text>
        </div>
      ) : null}

      <Button type="submit" disabled={!readyToSubmit} className="mt-1">
        {config.submitLabel} <ArrowRight className="size-4" />
      </Button>
      {readyToSubmit ? (
        config.formNote ? (
          <Text size="caption" tone="muted" className="text-center">
            {config.formNote}
          </Text>
        ) : null
      ) : (
        <p
          aria-live="polite"
          className="text-center text-caption text-ink-soft"
        >
          Bitte noch ausfüllen oder bestätigen:{" "}
          <span className="font-semibold text-ink">{openItems.join(", ")}</span>
        </p>
      )}
    </form>
  );
}
