import { pad } from "./dates";

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

/** The month `delta` months after `from` (before, when negative). */
function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/**
 * The first and last month the calendar may show: offsets 0..`maxOffset`,
 * counted back and forth from the month Booker shows at `monthOffset`. It
 * derives from `shown`, never from the clock, so a Berlin month boundary
 * passing with the page open cannot move the window off the shown month.
 */
export function bookingWindow(
  shown: YearMonth,
  monthOffset: number,
  maxOffset: number,
) {
  return {
    startMonth: monthKey(addMonths(shown, -monthOffset)),
    endMonth: monthKey(addMonths(shown, maxOffset - monthOffset)),
  };
}
