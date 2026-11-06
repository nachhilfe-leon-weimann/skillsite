"use client";

import { Calendar } from "@skillsite/ui/forms/calendar";
import { bookerText } from "@/content/booking";
import { BOOKING_TIMEZONE } from "../model/config";
import { bookingWindow, monthKey, monthsBetween } from "./booker-calendar";
import { MAX_MONTH_OFFSET } from "./use-availability";

type BookingCalendarProps = {
  today: string;
  shown: { year: number; month: number };
  monthOffset: number;
  loading: boolean;
  availableDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onChangeMonth: (delta: number) => void;
};

/**
 * The shown month with its header: the free days are selectable, and the
 * window runs from the current to the last bookable month.
 */
export function BookingCalendar({
  today,
  shown,
  monthOffset,
  loading,
  availableDates,
  selectedDate,
  onSelectDate,
  onChangeMonth,
}: BookingCalendarProps) {
  return (
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
  );
}
