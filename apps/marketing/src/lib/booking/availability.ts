import {
  BOOKING_TIMEZONE,
  bookingEvents,
  calUsername,
  type AvailabilityResponse,
  type BookingEventKey,
  type DayAvailability,
} from "@/lib/booking/config";
import { fetchCalSlots, type CalSlotsData } from "@/lib/booking/cal/client";
import { bookingToday, daysInMonth, pad } from "@/lib/booking/dates";
import { serverEnv } from "@/lib/env";

/** Turn Cal's raw slot map into displayable, sorted days (Berlin "HH:mm"). */
function formatDays(data: CalSlotsData): DayAvailability[] {
  const formatter = new Intl.DateTimeFormat("de-DE", {
    timeZone: BOOKING_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return Object.entries(data)
    .map(([date, entries]) => ({
      date,
      slots: entries.flatMap((entry) =>
        entry.start
          ? [
              {
                time: formatter.format(new Date(entry.start)),
                start: entry.start,
              },
            ]
          : [],
      ),
    }))
    .filter((day) => day.slots.length)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Month availability for a booking event. Only ever reports what Cal.com
 * actually offers - there is no synthetic fallback. When Cal.com is not
 * configured or unreachable, availability is reported as empty with a status the
 * UI surfaces, never as fabricated slots.
 */
export async function getAvailability(params: {
  event: BookingEventKey;
  year: number;
  month: number;
  durationMinutes: number;
}): Promise<AvailabilityResponse> {
  if (!serverEnv().CAL_API_KEY || !calUsername) {
    console.error(
      "[booking] Cal.com is not configured (CAL_API_KEY missing) - no availability served.",
    );
    return { status: "unconfigured", timeZone: BOOKING_TIMEZONE, days: [] };
  }

  const config = bookingEvents[params.event];
  const today = bookingToday();
  const monthStart = `${params.year}-${pad(params.month)}-01`;
  const start = monthStart < today ? today : monthStart;
  const end = `${params.year}-${pad(params.month)}-${pad(daysInMonth(params.year, params.month))}`;

  const data = await fetchCalSlots({
    eventTypeSlug: config.calEventSlug,
    username: calUsername,
    start,
    end,
    duration: config.durations ? params.durationMinutes : undefined,
  });
  if (data === null) {
    return { status: "error", timeZone: BOOKING_TIMEZONE, days: [] };
  }

  return { status: "ok", timeZone: BOOKING_TIMEZONE, days: formatDays(data) };
}
