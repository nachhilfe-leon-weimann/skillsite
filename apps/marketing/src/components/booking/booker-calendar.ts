import { pad, shownMonth } from "@/lib/booking/dates";

/**
 * The Booker's side of the calendar: its months as the calendar's "YYYY-MM"
 * keys. Booker keeps counting months as offsets from the current month in the
 * booking time zone; the calendar names them.
 */

type YearMonth = { year: number; month: number };

/** "YYYY-MM" of a year and month (1-12). */
export const monthKey = ({ year, month }: YearMonth) => `${year}-${pad(month)}`;

/** Months from `from` to the month `to` ("YYYY-MM"); negative when it lies before. */
export function monthsBetween(from: YearMonth, to: string) {
  const [year = NaN, month = NaN] = to.split("-").map(Number);
  return (year - from.year) * 12 + (month - from.month);
}

/** The first and last month the calendar may show: offsets 0..`maxOffset`. */
export function bookingWindow(maxOffset: number) {
  return {
    startMonth: monthKey(shownMonth(0)),
    endMonth: monthKey(shownMonth(maxOffset)),
  };
}
