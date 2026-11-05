"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  BadgeEuro,
  CalendarClock,
  CalendarX2,
  Check,
  Clock,
  Phone,
  Video,
} from "lucide-react";

import { Button } from "@skillsite/ui/primitives/button";
import { Card } from "@skillsite/ui/primitives/card";
import { InfoRow } from "@skillsite/ui/primitives/info-row";
import { Calendar } from "@skillsite/ui/forms/calendar";
import { Select } from "@skillsite/ui/forms/select";
import { useHydrated } from "@skillsite/ui/hooks/use-hydrated";
import { CenteredState } from "@skillsite/ui/layout/centered-state";
import { AnimatedHeight } from "@skillsite/ui/motion/animated-height";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Heading } from "@skillsite/ui/typography/heading";
import { Text } from "@skillsite/ui/typography/text";
import { bookingWindow, monthKey, monthsBetween } from "./booker-calendar";
import { BookingForm } from "./booking-form";
import { bookerText } from "@/content/booking";
import { requestBooking } from "../server/actions";
import { withFillDuration } from "../model/anti-spam";
import {
  BOOKING_TIMEZONE,
  bookingEvents,
  type AvailabilityResponse,
  type AvailabilityStatus,
  type BookingDraft,
  type BookingEventKey,
  type BookingSlot,
  type SubmitFailureReason,
} from "../model/config";
import { bookingToday, formatDateLabel, shownMonth } from "../model/dates";
import { durationLabel, formatSlotPrice } from "../model/pricing";
import { routes } from "@/lib/routes";
import { trackEvent } from "@/lib/analytics";

const MAX_MONTH_OFFSET = 3;

type BookerProps = {
  event: BookingEventKey;
  title: string;
  subtitle: string;
  initialSubject?: string;
  /** The booking day the server rendered for (`bookingToday()` in the page). */
  renderedToday: string;
};

/**
 * The booking day: the server's while hydrating, the visitor's from then on.
 * `/termin` is prerendered, so its HTML carries the build day; reading the clock
 * during hydration would mismatch on every later day and make React throw the
 * server HTML away. The visitor's day is read once per mount, so the shown month
 * and the booking window stay put when midnight passes with the page open.
 */
function useBookingToday(renderedToday: string) {
  const hydrated = useHydrated();
  const [visitorToday] = useState(bookingToday);
  return { today: hydrated ? visitorToday : renderedToday, hydrated };
}

type Step = "select" | "form" | "result";

type BookingPhase = "pending" | "confirmed" | "failed";

export function Booker({
  event,
  title,
  subtitle,
  initialSubject,
  renderedToday,
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

  const { today, hydrated } = useBookingToday(renderedToday);
  const shown = useMemo(
    () => shownMonth(today, monthOffset),
    [today, monthOffset],
  );

  // Funnel entry: the booking widget was opened. `event` distinguishes the
  // nachhilfe vs. kennenlernen flows and is stable, so this fires once.
  useEffect(() => {
    trackEvent("booking-started", { type: event });
  }, [event]);

  useEffect(() => {
    // The server's day may name another month: fetch only the visitor's.
    if (!hydrated) return;
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
  }, [
    event,
    duration,
    shown.year,
    shown.month,
    reloadKey,
    monthOffset,
    hydrated,
  ]);

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
        message: bookerText.result.genericFailure,
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

function UnavailableNotice({
  status,
  onRetry,
  takeFocusRef,
}: {
  status: "unconfigured" | "error";
  onRetry: () => void;
  /** Set when this notice replaced the calendar while its grid held focus. */
  takeFocusRef: RefObject<boolean>;
}) {
  const retryRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // The calendar grid this notice replaced held focus, which its removal
  // dropped: hand it to the Retry button, or else to the notice itself. Focus
  // anywhere else stays where it is.
  useLayoutEffect(() => {
    if (!takeFocusRef.current) return;
    takeFocusRef.current = false;
    (retryRef.current ?? statusRef.current)?.focus();
  }, [takeFocusRef]);

  if (status === "error") {
    return (
      <CenteredState
        icon={<CalendarX2 className="size-7 text-coral" aria-hidden />}
        title={bookerText.unavailable.error.title}
      >
        <Text tone="muted" className="mb-5">
          {bookerText.unavailable.error.text}
        </Text>
        <Button ref={retryRef} variant="outline" onClick={onRetry}>
          {bookerText.unavailable.error.retry}
        </Button>
      </CenteredState>
    );
  }

  return (
    <CenteredState
      ref={statusRef}
      tabIndex={-1}
      icon={<CalendarClock className="size-7 text-coral" aria-hidden />}
      title={bookerText.unavailable.unconfigured.title}
    >
      <Text tone="muted" className="mb-5">
        {bookerText.unavailable.unconfigured.text}
      </Text>
      <Button asChild variant="primary">
        <Link href={routes.contact}>{bookerText.directContact}</Link>
      </Button>
    </CenteredState>
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
          <Calendar
            month={monthKey(shown)}
            {...bookingWindow(shown, monthOffset, MAX_MONTH_OFFSET)}
            // Every month change - the buttons and the keys that leave the
            // month - takes the manual path: reset, no auto-advance.
            onMonthChange={(month) => {
              const delta = monthsBetween(shown, month);
              if (delta !== 0) onChangeMonth(delta);
            }}
            selected={selectedDate}
            onSelect={onSelectDate}
            isSelectable={(date) => availableDates.has(date)}
            busy={loading}
            today={today}
            timeZone={BOOKING_TIMEZONE}
            locale="de-DE"
            weekStartsOn={1}
            previousMonthLabel={bookerText.calendar.previousMonth}
            nextMonthLabel={bookerText.calendar.nextMonth}
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
        <p className="text-small font-semibold text-ink">
          {bookerText.calendar.slotsHeading}
        </p>
      </div>
      <p className="mb-2 text-caption text-ink-soft">
        {formatDateLabel(selectedDate)}
      </p>
      <div className="flex flex-col gap-2">
        {slots.map((slot) => (
          <button
            key={slot.start}
            type="button"
            onClick={() => onPick(slot)}
            className="rounded-lg border border-coral px-3 py-2.5 text-center text-small font-semibold text-coral transition-colors hover:bg-coral hover:text-white"
          >
            {slot.time}
            {bookerText.timeSuffix}
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
