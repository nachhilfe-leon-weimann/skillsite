"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { Card } from "@skillsite/ui/primitives/card";
import { AnimatedHeight } from "@skillsite/ui/motion/animated-height";
import { BookerAside } from "./booker-aside";
import { BookingForm } from "./booking-form";
import { BookingResult } from "./booking-result";
import { SelectStep } from "./select-step";
import { useAvailability } from "./use-availability";
import { useBookingSubmission } from "./use-booking-submission";
import { bookerText } from "@/content/booking";
import {
  bookingEvents,
  type BookingDraft,
  type BookingEventKey,
  type BookingSlot,
} from "../model/config";
import { formatDateLabel } from "../model/dates";
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
  const formTitleRef = useRef<HTMLDivElement>(null);
  const resultTitleRef = useRef<HTMLHeadingElement>(null);
  // A step change the visitor makes removes the control they used (a slot,
  // Back, Send, Resend, a new choice), so focus would fall to the page. It goes
  // to the title of what replaced it instead, or, back at the selection, to
  // the calendar once it shows (`SelectStep`).
  const focusNext = useRef<RefObject<HTMLElement | null> | null>(null);
  const selectionTakesFocus = useRef(false);

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

  useEffect(() => {
    const target = focusNext.current?.current;
    focusNext.current = null;
    // The card's own scroll (below) decides what is in view.
    target?.focus({ preventScroll: true });
  }, [step, bookingPhase]);

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
    focusNext.current = formTitleRef;
    // Funnel step: a time slot was chosen and the form opened.
    trackEvent("slot-selected", { type: event });
  };

  const backToSelect = () => {
    setSelectedSlot(null);
    setStep("select");
    selectionTakesFocus.current = true;
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
    selectionTakesFocus.current = true;
  };

  const submitBooking = (draft: BookingDraft) => {
    submit(draft);
    setStep("result");
    focusNext.current = resultTitleRef;
  };

  const resendBooking = () => {
    retryBooking();
    focusNext.current = resultTitleRef;
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

  return (
    <Card
      ref={cardRef}
      radius="3xl"
      className="mx-auto @container overflow-hidden"
    >
      <div className="grid @2xl:grid-cols-[20rem_1fr]">
        <BookerAside
          event={event}
          title={title}
          subtitle={subtitle}
          duration={duration}
          onDurationChange={changeDuration}
          durationLocked={selectedSlot !== null}
          summary={step !== "result" ? summary : null}
        />

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
              takeFocusRef={selectionTakesFocus}
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
                titleRef={formTitleRef}
                onBack={backToSelect}
                onSubmit={submitBooking}
              />
            </div>
          ) : null}

          {step === "result" ? (
            <BookingResult
              phase={bookingPhase}
              summary={summary}
              event={event}
              error={bookingError}
              titleRef={resultTitleRef}
              onRetry={resendBooking}
              onChooseAnother={chooseAnotherSlot}
            />
          ) : null}
        </AnimatedHeight>
      </div>
    </Card>
  );
}
