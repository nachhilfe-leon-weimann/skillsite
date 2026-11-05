import { BOOKING_TIMEZONE } from "./config";

export const pad = (n: number) => String(n).padStart(2, "0");

export const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Today in the booking timezone as "YYYY-MM-DD" (not the viewer's local day). */
export function bookingToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Year/month to show for an offset from the month of `today`, a booking-timezone
 * day from `bookingToday`. Anchored to the booking timezone so the calendar
 * matches availability even for viewers in other timezones.
 */
export function shownMonth(today: string, offset: number) {
  const [year = NaN, month = NaN] = today.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + offset, 1));
  return { year: target.getUTCFullYear(), month: target.getUTCMonth() + 1 };
}

/** A booking day ("YYYY-MM-DD") as a German label, e.g. "Di., 10. November". */
export function formatDateLabel(dateKey: string): string {
  const [year = NaN, month = NaN, day = NaN] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
