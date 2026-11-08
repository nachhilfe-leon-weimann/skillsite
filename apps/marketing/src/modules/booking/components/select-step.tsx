"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

import { Text } from "@skillsite/ui/typography/text";
import { bookerText } from "@/content/booking";
import type { AvailabilityStatus, BookingSlot } from "../model/config";
import { BookingCalendar } from "./booking-calendar";
import { TimeSlots } from "./time-slots";
import { UnavailableNotice } from "./unavailable-notice";

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
  /**
   * Set when this step should take focus once it shows: the control that held
   * focus went with the previous step. The calendar's tab stop takes it, or
   * the notice that stands in for the calendar.
   */
  takeFocusRef: RefObject<boolean>;
};

/** Focus fell to the page: the control that held it is gone. */
function focusIsLost() {
  const active = document.activeElement;
  return !active || active === document.body;
}

/**
 * The first step: the calendar and the free times of the selected day, or the
 * notice that replaces both when no availability can be shown.
 */
export function SelectStep({
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
  takeFocusRef,
}: SelectStepProps) {
  const calendarRef = useRef<HTMLDivElement | null>(null);
  // When the unavailable notice replaces the calendar, it takes focus if the
  // calendar's grid held it, or if this step still waits for focus and focus
  // is still lost. Only the grid: a clicked month button keeps main's
  // behaviour (focus falls to <body>, the page stays where it is).
  const trackGridFocus = useCallback(
    (node: HTMLDivElement | null) => {
      calendarRef.current = node;
      if (!node) return;
      return () => {
        calendarRef.current = null;
        const grid = node.querySelector("[role=grid]");
        const gridHadFocus = grid?.contains(document.activeElement) ?? false;
        takeFocusRef.current =
          gridHadFocus || (takeFocusRef.current && focusIsLost());
      };
    },
    [takeFocusRef],
  );

  // Once the calendar shows its month, its tab stop - the selected day -
  // takes the focus this step waits for, unless the visitor has put focus
  // somewhere since.
  useEffect(() => {
    if (!takeFocusRef.current || loading || status !== "ok") return;
    takeFocusRef.current = false;
    if (!focusIsLost()) return;
    calendarRef.current
      ?.querySelector<HTMLElement>('[role=grid] button[tabindex="0"]')
      ?.focus({ preventScroll: true });
  }, [loading, status, takeFocusRef]);

  if (!loading && status !== "ok") {
    return (
      <UnavailableNotice
        status={status}
        onRetry={() => {
          // Retry goes with the notice: the calendar takes focus once loaded.
          takeFocusRef.current = true;
          onRetry();
        }}
        takeFocusRef={takeFocusRef}
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
