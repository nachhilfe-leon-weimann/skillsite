"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeEuro,
  CalendarX2,
  Check,
  Clock,
  Phone,
  Video,
} from "lucide-react";

import { Button } from "@skillsite/ui/primitives/button";
import { Card } from "@skillsite/ui/primitives/card";
import { InfoRow } from "@skillsite/ui/primitives/info-row";
import { Select } from "@skillsite/ui/forms/select";
import { CenteredState } from "@skillsite/ui/layout/centered-state";
import { AnimatedHeight } from "@skillsite/ui/motion/animated-height";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { BookingCalendar } from "./booking-calendar";
import { BookingForm } from "./booking-form";
import { TimeSlots } from "./time-slots";
import { UnavailableNotice } from "./unavailable-notice";
import { useAvailability } from "./use-availability";
import {
  useBookingSubmission,
  type BookingError,
  type BookingPhase,
} from "./use-booking-submission";
import { bookerText } from "@/content/booking";
import {
  bookingEvents,
  type AvailabilityStatus,
  type BookingDraft,
  type BookingEventKey,
  type BookingSlot,
} from "../model/config";
import { formatDateLabel } from "../model/dates";
import { durationLabel, formatSlotPrice } from "../model/pricing";
import { routes } from "@/lib/routes";
import { trackEvent } from "@/lib/analytics";

type BookerProps = {
  event: BookingEventKey;
  title: string;
  subtitle: string;
  initialSubject?: string;
  /** The booking day the server rendered for (`bookingToday()` in the page). */
  renderedToday: string;
};

type Step = "select" | "form" | "result";

export function Booker({
  event,
  title,
  subtitle,
  initialSubject,
  renderedToday,
}: BookerProps) {
  const config = bookingEvents[event];

  const [duration, setDuration] = useState(config.defaultDuration);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
    start: string;
  } | null>(null);
  const [step, setStep] = useState<Step>("select");
  const cardRef = useRef<HTMLDivElement>(null);

  // Funnel entry: the booking widget was opened. `event` distinguishes the
  // nachhilfe vs. kennenlernen flows and is stable, so this fires once.
  useEffect(() => {
    trackEvent("booking-started", { type: event });
  }, [event]);

  const {
    today,
    shown,
    monthOffset,
    availability,
    loading,
    status,
    changeMonth: showMonth,
    restartSearch,
    retry,
  } = useAvailability(event, duration, setSelectedDate, renderedToday);
  const {
    phase: bookingPhase,
    error: bookingError,
    submit,
    retryBooking,
    reset: resetBooking,
  } = useBookingSubmission(event, duration);

  // Leaving the slot picker shrinks the card; if its top scrolled out of view
  // (e.g. a slot picked far down a long mobile list), bring it back so the next
  // step isn't stranded off-screen.
  useEffect(() => {
    if (step === "select") return;
    const card = cardRef.current;
    if (!card || card.getBoundingClientRect().top >= 0) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    card.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [step]);

  const resetSelection = () => {
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const changeDuration = (next: number) => {
    if (next === duration) return;
    setDuration(next);
    // Fresh search for the new duration — let it skip to the soonest free month.
    restartSearch();
    resetSelection();
  };

  const changeMonth = (delta: number) => {
    showMonth(delta);
    resetSelection();
  };

  const pickSlot = (date: string, slot: BookingSlot) => {
    setSelectedSlot({ date, time: slot.time, start: slot.start });
    setStep("form");
    // Funnel step: a time slot was chosen and the form opened.
    trackEvent("slot-selected", { type: event });
  };

  const backToSelect = () => {
    setSelectedSlot(null);
    setStep("select");
  };

  // Leave the result step and start a fresh selection. Reloads availability
  // because a booking just changed it: the confirmed slot is now gone, and a
  // slot-taken conflict means our cached view was stale. The effect preselects
  // the soonest free day once the new data lands.
  const chooseAnotherSlot = () => {
    setSelectedSlot(null);
    setSelectedDate(null);
    resetBooking();
    setStep("select");
    restartSearch();
  };

  const submitBooking = (draft: BookingDraft) => {
    submit(draft);
    setStep("result");
  };

  const availableDates = new Set(
    (availability?.days ?? []).map((day) => day.date),
  );
  const daySlots =
    availability?.days.find((day) => day.date === selectedDate)?.slots ?? [];
  const summary = selectedSlot
    ? bookerText.slotSummary(
        formatDateLabel(selectedSlot.date),
        selectedSlot.time,
      )
    : null;

  const priceLabel = config.priceLabel;
  const slotPrice = formatSlotPrice(config, duration);

  return (
    <Card
      ref={cardRef}
      radius="3xl"
      className="mx-auto @container overflow-hidden"
    >
      <div className="grid @2xl:grid-cols-[20rem_1fr]">
        <aside className="flex flex-col bg-navy p-panel-booker text-on-navy">
          <Eyebrow tone="inverse-accent">{bookerText.aside.eyebrow}</Eyebrow>
          <Heading as="h2" size="h4" className="mt-3.5 text-white">
            {title}
          </Heading>
          <Text size="small" tone="inverse-soft" className="mt-1 mb-5">
            {subtitle}
          </Text>

          <div className="flex flex-col gap-3">
            <InfoRow
              icon={
                config.medium === "phone" ? (
                  <Phone className="size-4" aria-hidden />
                ) : (
                  <Video className="size-4" aria-hidden />
                )
              }
            >
              {config.mediumLabel}
            </InfoRow>
            <InfoRow icon={<BadgeEuro className="size-4" aria-hidden />}>
              {priceLabel}
            </InfoRow>
            {config.durations ? (
              <Select
                label={bookerText.durationLabel}
                hideLabel
                tone="inverse"
                icon={<Clock className="size-4" aria-hidden />}
                value={duration}
                onChange={changeDuration}
                disabled={selectedSlot !== null}
                options={config.durations.map((value) => ({
                  value,
                  label: bookerText.minutes(value),
                }))}
              />
            ) : (
              <InfoRow icon={<Clock className="size-4" aria-hidden />}>
                {durationLabel(config, duration)}
              </InfoRow>
            )}
          </div>

          {summary && step !== "result" ? (
            <Card surface="glass" className="mt-6 p-4">
              <Eyebrow as="p" dot={false} tone="inverse-accent">
                {bookerText.aside.summaryEyebrow}
              </Eyebrow>
              <p className="mt-1.5 font-heading font-bold text-white">
                {summary}
              </p>
              {slotPrice ? (
                <p className="mt-1 text-small font-semibold text-on-navy-soft">
                  {slotPrice}
                </p>
              ) : null}
            </Card>
          ) : null}

          {event === "nachhilfe" ? (
            <Text
              size="caption"
              tone="inherit"
              className="mt-auto pt-6 text-on-navy-muted"
            >
              {bookerText.aside.cancellationNote}
            </Text>
          ) : null}
        </aside>

        <AnimatedHeight className="flex min-h-96 flex-col p-panel-booker-main">
          {step === "select" ? (
            <SelectStep
              today={today}
              shown={shown}
              monthOffset={monthOffset}
              loading={loading}
              status={status}
              onRetry={retry}
              availableDates={availableDates}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setSelectedSlot(null);
              }}
              daySlots={daySlots}
              onPickSlot={pickSlot}
              onChangeMonth={changeMonth}
            />
          ) : null}

          {step === "form" && summary && selectedSlot ? (
            <div className="mx-auto w-full max-w-lg motion-safe:animate-fade">
              <BookingForm
                event={event}
                slotLabel={summary}
                slotStart={selectedSlot.start}
                duration={config.durations ? duration : undefined}
                initialSubject={initialSubject}
                onBack={backToSelect}
                onSubmit={submitBooking}
              />
            </div>
          ) : null}

          {step === "result" ? (
            <ResultStep
              phase={bookingPhase}
              summary={summary}
              event={event}
              error={bookingError}
              onRetry={retryBooking}
              onChooseAnother={chooseAnotherSlot}
            />
          ) : null}
        </AnimatedHeight>
      </div>
    </Card>
  );
}

type SelectStepProps = {
  today: string;
  shown: { year: number; month: number };
  monthOffset: number;
  loading: boolean;
  status: AvailabilityStatus;
  onRetry: () => void;
  availableDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  daySlots: BookingSlot[];
  onPickSlot: (date: string, slot: BookingSlot) => void;
  onChangeMonth: (delta: number) => void;
};

function SelectStep({
  today,
  shown,
  monthOffset,
  loading,
  status,
  onRetry,
  availableDates,
  selectedDate,
  onSelectDate,
  daySlots,
  onPickSlot,
  onChangeMonth,
}: SelectStepProps) {
  // Whether the calendar's grid held focus when the unavailable notice
  // replaced it. Only the grid: a clicked month button keeps main's behaviour
  // (focus falls to <body>, the page stays where it is).
  const gridHadFocus = useRef(false);
  const trackGridFocus = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    return () => {
      const grid = node.querySelector("[role=grid]");
      gridHadFocus.current = grid?.contains(document.activeElement) ?? false;
    };
  }, []);

  if (!loading && status !== "ok") {
    return (
      <UnavailableNotice
        status={status}
        onRetry={onRetry}
        takeFocusRef={gridHadFocus}
      />
    );
  }

  const noneThisMonth =
    !loading && status === "ok" && availableDates.size === 0;

  return (
    <div className="mx-auto flex w-full flex-1 flex-col justify-start motion-safe:animate-rise [--reveal-travel:6px] motion-safe:[animation-delay:80ms]">
      <div className="grid gap-x-panel-booker-main gap-y-5 @4xl:grid-cols-[3fr_1fr]">
        <div ref={trackGridFocus}>
          <BookingCalendar
            today={today}
            shown={shown}
            monthOffset={monthOffset}
            loading={loading}
            availableDates={availableDates}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            onChangeMonth={onChangeMonth}
          />
        </div>

        <div>
          {selectedDate ? (
            <TimeSlots
              selectedDate={selectedDate}
              slots={daySlots}
              onPick={(slot) => onPickSlot(selectedDate, slot)}
            />
          ) : noneThisMonth ? (
            <Text size="small" tone="muted">
              {bookerText.calendar.noneThisMonth}
            </Text>
          ) : (
            <Text size="small" tone="muted" className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-coral" aria-hidden />
              {bookerText.calendar.pickDay}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}

type ResultStepProps = {
  phase: BookingPhase;
  summary: string | null;
  event: BookingEventKey;
  error: BookingError | null;
  onRetry: () => void;
  onChooseAnother: () => void;
};

function ResultStep({
  phase,
  summary,
  event,
  error,
  onRetry,
  onChooseAnother,
}: ResultStepProps) {
  if (phase === "pending") {
    return (
      <CenteredState
        icon={
          <span
            className="size-6 animate-spin rounded-full border-2 border-coral border-t-transparent"
            aria-hidden
          />
        }
        title={bookerText.result.pending.title}
      >
        <Text tone="muted" aria-live="polite">
          {bookerText.result.pending.text}
        </Text>
      </CenteredState>
    );
  }

  if (phase === "confirmed") {
    return (
      <CenteredState
        icon={<Check className="size-7 text-coral" aria-hidden />}
        title={bookerText.result.confirmed.title}
      >
        {summary ? (
          <Card
            asChild
            surface="inset"
            className="mx-auto mb-5 max-w-xs p-3.5 text-left"
          >
            <InfoRow
              variant="summary"
              label={bookerText.result.confirmed.summaryLabel}
              icon={
                event === "kennenlernen" ? (
                  <Phone className="size-4" aria-hidden />
                ) : (
                  <Video className="size-4" aria-hidden />
                )
              }
            >
              {summary}
            </InfoRow>
          </Card>
        ) : null}
        <Text tone="muted" className="mb-6">
          {bookerText.result.confirmed.text[event]}
        </Text>
        <Button variant="outline" onClick={onChooseAnother}>
          {bookerText.result.confirmed.action[event]}
        </Button>
      </CenteredState>
    );
  }

  const message = error?.message ?? bookerText.result.genericFailure;

  // Retrying can't help in either case - point to the direct contact instead.
  if (error?.reason === "rate_limited" || error?.reason === "blocked") {
    return (
      <CenteredState
        icon={<CalendarX2 className="size-7 text-coral" aria-hidden />}
        title={
          error.reason === "blocked"
            ? bookerText.result.blockedTitle
            : bookerText.result.rateLimitedTitle
        }
      >
        <Text tone="muted" className="mb-5">
          {message}
        </Text>
        <Button asChild variant="primary">
          <Link href={routes.contact}>{bookerText.directContact}</Link>
        </Button>
      </CenteredState>
    );
  }

  if (error?.reason === "slot_taken") {
    return (
      <CenteredState
        icon={<CalendarX2 className="size-7 text-coral" aria-hidden />}
        title={bookerText.result.slotTakenTitle}
      >
        <Text tone="muted" className="mb-5">
          {message}
        </Text>
        <Button onClick={onChooseAnother}>
          {bookerText.result.chooseAnother}
        </Button>
      </CenteredState>
    );
  }

  return (
    <CenteredState
      icon={<CalendarX2 className="size-7 text-coral" aria-hidden />}
      title={bookerText.result.failedTitle}
    >
      <Text tone="muted" className="mb-5">
        {message}
      </Text>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={onRetry}>{bookerText.result.resend}</Button>
        <Button variant="outline" onClick={onChooseAnother}>
          {bookerText.result.chooseAnother}
        </Button>
      </div>
    </CenteredState>
  );
}
