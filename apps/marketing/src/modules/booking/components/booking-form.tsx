"use client";

import { useMemo, useState, type Ref } from "react";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";

import { Button } from "@skillsite/ui/primitives/button";
import { Card } from "@skillsite/ui/primitives/card";
import { IconButton } from "@skillsite/ui/primitives/icon-button";
import { TextLink } from "@skillsite/ui/primitives/link";
import { Text } from "@skillsite/ui/typography/text";
import { cn } from "@skillsite/ui/utils/cn";
import { bookerText } from "@/content/booking";
import { routes } from "@/lib/routes";
import {
  bookingEvents,
  startsWithinWithdrawalPeriod,
  type BookingDraft,
  type BookingEventKey,
} from "../model/config";
import { emptyValueFor, type FieldDef, type FieldValue } from "../model/fields";
import { useBookingForm } from "./use-booking-form";
import { TextField } from "./fields/text-field";
import { ChipsField } from "./fields/chips-field";
import { RadioField } from "./fields/radio-field";

const formText = bookerText.form;

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
  /**
   * The form's title with the chosen slot, where focus goes when the form
   * replaces the picked slot. A target for script only: it is no control, so
   * it draws no focus ring.
   */
  titleRef?: Ref<HTMLDivElement>;
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
  titleRef,
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
      ? [formText.withdrawalNoticeItem]
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
        <label htmlFor="booking-hp">{formText.honeypotLabel}</label>
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
        <IconButton
          size="sm"
          onClick={onBack}
          aria-label={formText.back}
          className="shrink-0"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </IconButton>
        <div ref={titleRef} tabIndex={-1} className="min-w-0 outline-none">
          <Text className="font-semibold text-ink">{formText.title}</Text>
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
        <Card surface="inset" className="flex flex-col gap-3 p-4">
          {needsEarlyPerformanceConsent ? (
            <label className="flex cursor-pointer items-start gap-3 text-note leading-relaxed text-ink">
              <input
                type="checkbox"
                checked={earlyPerformanceRequested}
                onChange={(formEvent) =>
                  setEarlyPerformanceRequested(formEvent.target.checked)
                }
                className="mt-1 size-4 shrink-0 accent-coral"
                required
              />
              <span>{formText.earlyPerformanceConsent}</span>
            </label>
          ) : null}
          <Text size="note" tone="muted">
            {formText.legalNote.acceptTerms}{" "}
            <TextLink href={routes.agb}>
              {formText.legalNote.termsLink}
            </TextLink>
            {formText.legalNote.privacyText}{" "}
            <TextLink href={routes.datenschutz}>
              {formText.legalNote.privacyLink}
            </TextLink>
            {formText.legalNote.end}
          </Text>
        </Card>
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
          {formText.openItems}{" "}
          <span className="font-semibold text-ink">{openItems.join(", ")}</span>
        </p>
      )}
    </form>
  );
}
