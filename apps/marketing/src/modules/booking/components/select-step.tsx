"use client";

import { useCallback, useRef } from "react";

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
};

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
