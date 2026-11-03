"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeEuro,
  CalendarClock,
  CalendarX2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  Video,
} from "lucide-react";

import { Button } from "@skillsite/ui/primitives/button";
import { Card } from "@skillsite/ui/primitives/card";
import { Select } from "@skillsite/ui/forms/select";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { cn } from "@skillsite/ui/utils/cn";
import { BookingForm } from "@/components/booking/booking-form";
import { bookerText } from "@/content/booking";
import { requestBooking } from "@/lib/booking/actions";
import { withFillDuration } from "@/lib/booking/anti-spam";
import {
  BOOKING_TIMEZONE,
  bookingEvents,
  type AvailabilityResponse,
  type AvailabilityStatus,
  type BookingDraft,
  type BookingEventKey,
  type BookingSlot,
  type SubmitFailureReason,
} from "@/lib/booking/config";
import {
  bookingToday,
  daysInMonth,
  pad,
  shownMonth,
} from "@/lib/booking/dates";
import { routes } from "@/lib/routes";
import { trackEvent } from "@/lib/analytics";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];
const MAX_MONTH_OFFSET = 3;

const EUR = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

/** 0 = Mon ... 6 = Sun. */
const firstWeekdayIndex = (year: number, month: number) =>
  (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;

function dateLabel(dateStr: string) {
  const [year = NaN, month = NaN, day = NaN] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

type BookerProps = {
  event: BookingEventKey;
  title: string;
  subtitle: string;
  initialSubject?: string;
};

type Step = "select" | "form" | "result";

type BookingPhase = "pending" | "confirmed" | "failed";

export function Booker({
  event,
  title,
  subtitle,
  initialSubject,
}: BookerProps) {
  const config = bookingEvents[event];

  const [duration, setDuration] = useState(config.defaultDuration);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
    start: string;
  } | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [step, setStep] = useState<Step>("select");
  const [bookingPhase, setBookingPhase] = useState<BookingPhase>("pending");
  const [bookingError, setBookingError] = useState<{
    message: string;
    reason: SubmitFailureReason;
  } | null>(null);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null);
  // Auto-skip empty months only while searching (initial load / duration
  // change). Manual month navigation switches this off so going "back" into an
  // empty month doesn't bounce the user forward again.
  const autoAdvance = useRef(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const shown = useMemo(() => shownMonth(monthOffset), [monthOffset]);

  // Funnel entry: the booking widget was opened. `event` distinguishes the
  // nachhilfe vs. kennenlernen flows and is stable, so this fires once.
  useEffect(() => {
    trackEvent("booking-started", { type: event });
  }, [event]);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({
      event,
      duration: String(duration),
      year: String(shown.year),
      month: String(shown.month),
    });
    fetch(`/api/booking/availability?${query}`, { signal: controller.signal })
      .then((res) => {
        // A non-OK response (e.g. 400) isn't an AvailabilityResponse — treat it
        // as an error instead of letting a missing `status` read as "ok".
        if (!res.ok)
          throw new Error(`Availability request failed: ${res.status}`);
        return res.json();
      })
      .then((data: AvailabilityResponse) => {
        setAvailability(data);
        setLoading(false);
        if (data.status !== "ok") return;
        const firstDay = data.days[0];
        if (firstDay) {
          // Preselect the soonest free day so its times show right away.
          setSelectedDate(firstDay.date);
        } else if (autoAdvance.current && monthOffset < MAX_MONTH_OFFSET) {
          // Empty month → hop forward to the next month with free slots, but
          // only while auto-searching, never in response to manual navigation.
          setMonthOffset((current) => Math.min(MAX_MONTH_OFFSET, current + 1));
          setLoading(true);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setAvailability({
          status: "error",
          timeZone: BOOKING_TIMEZONE,
          days: [],
        });
        setLoading(false);
      });
    return () => controller.abort();
  }, [event, duration, shown.year, shown.month, reloadKey, monthOffset]);

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
    setLoading(true);
    // Fresh search for the new duration — let it skip to the soonest free month.
    autoAdvance.current = true;
    resetSelection();
  };

  const changeMonth = (delta: number) => {
    // Explicit navigation: respect the chosen month, don't auto-skip past it.
    autoAdvance.current = false;
    setMonthOffset((current) =>
      Math.min(MAX_MONTH_OFFSET, Math.max(0, current + delta)),
    );
    setLoading(true);
    resetSelection();
  };

  const retry = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
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
    setBookingError(null);
    setBookingDraft(null);
    setStep("select");
    autoAdvance.current = true;
    retry();
  };

  // Send the booking to Cal.com. We moved off the slot picker but wait on the
  // real result before claiming success — Cal's create pipeline (mail, calendar
  // event, webhooks) takes a few seconds, and a slot can be gone by now, so we
  // never tell the user "sent" until Cal.com confirms it.
  const finalizeBooking = async (draft: BookingDraft) => {
    setBookingPhase("pending");
    try {
      // Measured per send, so a retry carries the time elapsed up to the retry.
      const result = await requestBooking(
        withFillDuration(draft, performance.now()),
      );
      if (result.ok) {
        setBookingPhase("confirmed");
        // Conversion: a booking was actually confirmed by Cal.com.
        trackEvent("booking-confirmed", { type: event, duration });
      } else {
        setBookingError({
          message: result.error,
          reason: result.reason,
        });
        setBookingPhase("failed");
        trackEvent("booking-failed", { type: event, reason: result.reason });
      }
    } catch {
      setBookingError({
        message:
          "Die Buchung hat nicht geklappt. Bitte versuch es erneut oder schreib mir direkt.",
        reason: "generic",
      });
      setBookingPhase("failed");
      // The request never produced a result (offline, stale deployment), so the
      // server log has no outcome line - this event is the only trace.
      trackEvent("booking-failed", { type: event, reason: "request_error" });
    }
  };

  const submitBooking = (draft: BookingDraft) => {
    setBookingDraft(draft);
    setBookingError(null);
    setStep("result");
    void finalizeBooking(draft);
  };

  const retryBooking = () => {
    if (!bookingDraft) return;
    setBookingError(null);
    void finalizeBooking(bookingDraft);
  };

  const status: AvailabilityStatus = availability?.status ?? "ok";
  const availableDates = new Set(
    (availability?.days ?? []).map((day) => day.date),
  );
  const daySlots =
    availability?.days.find((day) => day.date === selectedDate)?.slots ?? [];
  const summary = selectedSlot
    ? `${dateLabel(selectedSlot.date)} – ${selectedSlot.time} Uhr`
    : null;

  const durationLabel = config.durations
    ? `${duration} Minuten`
    : `${config.defaultDuration} Minuten`;
  const priceLabel = config.priceLabel;
  const slotPrice =
    config.pricePerHour != null
      ? EUR.format((config.pricePerHour * duration) / 60)
      : null;

  return (
    <Card
      ref={cardRef}
      radius="3xl"
      className="mx-auto @container overflow-hidden"
    >
      <div className="grid @2xl:grid-cols-[20rem_1fr]">
        <aside className="flex flex-col bg-navy p-panel-booker text-on-navy">
          <Eyebrow tone="inverse-accent">Buchung</Eyebrow>
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
                  label: `${value} Minuten`,
                }))}
              />
            ) : (
              <InfoRow icon={<Clock className="size-4" aria-hidden />}>
                {durationLabel}
              </InfoRow>
            )}
          </div>

          {summary && step !== "result" ? (
            <Card surface="glass" className="mt-6 p-4">
              <Eyebrow as="p" dot={false} tone="inverse-accent">
                Dein Termin
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
              Bis 24&nbsp;Stunden vorher kostenfrei verschieben oder absagen.
            </Text>
          ) : null}
        </aside>

        <AnimatedHeight className="flex min-h-96 flex-col p-panel-booker-main">
          {step === "select" ? (
            <SelectStep
              monthOffset={monthOffset}
              shown={shown}
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

function AnimatedHeight({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{ height }}
      className="overflow-hidden motion-safe:transition-[height] motion-safe:duration-slow motion-safe:ease-soft"
    >
      <div ref={innerRef} className={className}>
        {children}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 text-on-navy">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-overlay-8 text-accent-blue">
        {icon}
      </span>
      <Text as="span" size="small" tone="inherit">
        {children}
      </Text>
    </div>
  );
}

function CenteredState({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="m-auto max-w-sm text-center motion-safe:animate-rise [--reveal-travel:6px] motion-safe:[animation-delay:80ms]">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-accent-tint-16">
        {icon}
      </div>
      <Heading as="h3" size="h4" className="mb-2">
        {title}
      </Heading>
      {children}
    </div>
  );
}

function UnavailableNotice({
  status,
  onRetry,
}: {
  status: "unconfigured" | "error";
  onRetry: () => void;
}) {
  if (status === "error") {
    return (
      <CenteredState
        icon={<CalendarX2 className="size-7 text-coral" aria-hidden />}
        title="Termine konnten nicht geladen werden"
      >
        <Text tone="muted" className="mb-5">
          Das hat gerade nicht geklappt. Bitte versuch es noch einmal.
        </Text>
        <Button variant="outline" onClick={onRetry}>
          Erneut versuchen
        </Button>
      </CenteredState>
    );
  }

  return (
    <CenteredState
      icon={<CalendarClock className="size-7 text-coral" aria-hidden />}
      title="Online-Terminwahl gerade nicht verfügbar"
    >
      <Text tone="muted" className="mb-5">
        Schreib mir einfach direkt – wir finden zusammen einen passenden Termin.
      </Text>
      <Button asChild variant="primary">
        <Link href={routes.contact}>Direkt anfragen</Link>
      </Button>
    </CenteredState>
  );
}

type SelectStepProps = {
  monthOffset: number;
  shown: { year: number; month: number };
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
  monthOffset,
  shown,
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
  if (!loading && status !== "ok") {
    return <UnavailableNotice status={status} onRetry={onRetry} />;
  }

  const leading = firstWeekdayIndex(shown.year, shown.month);
  const total = daysInMonth(shown.year, shown.month);
  const todayStr = bookingToday();
  const noneThisMonth =
    !loading && status === "ok" && availableDates.size === 0;

  return (
    <div className="mx-auto flex w-full flex-1 flex-col justify-start motion-safe:animate-rise [--reveal-travel:6px] motion-safe:[animation-delay:80ms]">
      <div className="grid gap-x-panel-booker-main gap-y-5 @4xl:grid-cols-[3fr_1fr]">
        <div>
          <div className="mb-4 flex">
            <div className="m-auto">
              <strong className="font-heading text-month text-ink">
                {MONTHS[shown.month - 1]} {shown.year}
              </strong>
            </div>
            <div className="flex flex-row gap-3">
              <button
                type="button"
                onClick={() => onChangeMonth(-1)}
                disabled={monthOffset === 0}
                aria-label="Vorheriger Monat"
                className="flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onChangeMonth(1)}
                disabled={monthOffset >= MAX_MONTH_OFFSET}
                aria-label="Nächster Monat"
                className="flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-caption font-semibold text-ink-soft"
              >
                {day}
              </div>
            ))}
          </div>

          <div
            key={`${shown.year}-${shown.month}`}
            className="grid grid-cols-7 gap-1.5 motion-safe:animate-fade"
            aria-busy={loading}
          >
            {Array.from({ length: leading }).map((_, index) => (
              <div key={`blank-${index}`} />
            ))}
            {Array.from({ length: total }).map((_, index) => {
              const day = index + 1;
              const date = `${shown.year}-${pad(shown.month)}-${pad(day)}`;
              const available = !loading && availableDates.has(date);
              const selected = selectedDate === date;
              const isToday = date === todayStr;

              return (
                <button
                  key={date}
                  type="button"
                  disabled={!available}
                  onClick={() => onSelectDate(date)}
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-lg border text-small transition-colors",
                    selected && "border-coral bg-coral font-bold text-white",
                    !selected &&
                      available &&
                      "border-accent-tint-45 bg-accent-tint-11 font-semibold text-coral hover:bg-coral hover:text-white",
                    !available &&
                      "border-line bg-bg text-ink-soft/50 disabled:pointer-events-none",
                    loading && "animate-pulse",
                  )}
                >
                  {day}
                  {isToday ? (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute bottom-1.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full",
                        selected ? "bg-white" : "bg-coral",
                      )}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
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
              In diesem Monat sind keine Termine frei. Schau im nächsten Monat
              nach.
            </Text>
          ) : (
            <Text size="small" tone="muted" className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-coral" aria-hidden />
              Wähle einen farbig markierten Tag, um freie Zeiten zu sehen.
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}

function TimeSlots({
  selectedDate,
  slots,
  onPick,
}: {
  selectedDate: string;
  slots: BookingSlot[];
  onPick: (slot: BookingSlot) => void;
}) {
  return (
    <div className="flex flex-col">
      {/* Empty h-9 row mirrors the calendar's month-nav height so the slots
          line up with the day grid beside them. */}
      <div className="mb-4 flex h-9 items-center">
        <p className="text-small font-semibold text-ink">Freie Uhrzeiten</p>
      </div>
      <p className="mb-2 text-caption text-ink-soft">
        {dateLabel(selectedDate)}
      </p>
      <div className="flex flex-col gap-2">
        {slots.map((slot) => (
          <button
            key={slot.start}
            type="button"
            onClick={() => onPick(slot)}
            className="rounded-lg border border-coral px-3 py-2.5 text-center text-small font-semibold text-coral transition-colors hover:bg-coral hover:text-white"
          >
            {slot.time} Uhr
          </button>
        ))}
      </div>
    </div>
  );
}

type ResultStepProps = {
  phase: BookingPhase;
  summary: string | null;
  event: BookingEventKey;
  error: { message: string; reason: SubmitFailureReason } | null;
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
        title="Termin wird gebucht …"
      >
        <Text tone="muted" aria-live="polite">
          Einen Moment – die Buchung wird bestätigt.
        </Text>
      </CenteredState>
    );
  }

  if (phase === "confirmed") {
    return (
      <CenteredState
        icon={<Check className="size-7 text-coral" aria-hidden />}
        title="Termin gebucht!"
      >
        {summary ? (
          <Card
            surface="inset"
            className="mx-auto mb-5 flex max-w-xs items-center gap-3 p-3.5 text-left"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-tint-12 text-coral">
              {event === "kennenlernen" ? (
                <Phone className="size-4" aria-hidden />
              ) : (
                <Video className="size-4" aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <Eyebrow as="p" dot={false} tone="muted">
                Dein Termin
              </Eyebrow>
              <p className="font-heading font-bold text-ink">{summary}</p>
            </div>
          </Card>
        ) : null}
        <Text tone="muted" className="mb-6">
          {event === "kennenlernen"
            ? "Ich rufe dich zum vereinbarten Termin an. Die Bestätigung kommt per E-Mail."
            : "Die Terminbestätigung kommt per E-Mail. Die Einwahl richtet sich nach der gewählten Plattform."}
        </Text>
        <Button variant="outline" onClick={onChooseAnother}>
          {event === "kennenlernen" ? <>Fertig</> : <>Weiteren Termin buchen</>}
        </Button>
      </CenteredState>
    );
  }

  const message =
    error?.message ??
    "Die Buchung hat nicht geklappt. Bitte versuch es erneut oder schreib mir direkt.";

  // Retrying can't help in either case - point to the direct contact instead.
  if (error?.reason === "rate_limited" || error?.reason === "blocked") {
    return (
      <CenteredState
        icon={<CalendarX2 className="size-7 text-coral" aria-hidden />}
        title={
          error.reason === "blocked"
            ? "Termin nicht gebucht"
            : "Zu viele Anfragen"
        }
      >
        <Text tone="muted" className="mb-5">
          {message}
        </Text>
        <Button asChild variant="primary">
          <Link href={routes.contact}>Direkt anfragen</Link>
        </Button>
      </CenteredState>
    );
  }

  if (error?.reason === "slot_taken") {
    return (
      <CenteredState
        icon={<CalendarX2 className="size-7 text-coral" aria-hidden />}
        title="Termin schon vergeben"
      >
        <Text tone="muted" className="mb-5">
          {message}
        </Text>
        <Button onClick={onChooseAnother}>Anderen Termin wählen</Button>
      </CenteredState>
    );
  }

  return (
    <CenteredState
      icon={<CalendarX2 className="size-7 text-coral" aria-hidden />}
      title="Das hat nicht ganz geklappt"
    >
      <Text tone="muted" className="mb-5">
        {message}
      </Text>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={onRetry}>Erneut senden</Button>
        <Button variant="outline" onClick={onChooseAnother}>
          Anderen Termin wählen
        </Button>
      </div>
    </CenteredState>
  );
}
