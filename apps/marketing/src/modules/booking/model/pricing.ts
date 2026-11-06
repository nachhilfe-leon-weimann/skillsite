import { bookerText } from "@/content/booking";
import type { BookingEventConfig } from "./config";

const EUR = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

/**
 * Price of one slot: the event's hourly price scaled linearly by the duration
 * in minutes, in German currency format; `null` for a free event.
 */
export function formatSlotPrice(
  config: BookingEventConfig,
  duration: number,
): string | null {
  return config.pricePerHour != null
    ? EUR.format((config.pricePerHour * duration) / 60)
    : null;
}

/** The slot's length: the chosen duration, or a fixed-length event's own. */
export function durationLabel(
  config: BookingEventConfig,
  duration: number,
): string {
  return config.durations
    ? bookerText.minutes(duration)
    : bookerText.minutes(config.defaultDuration);
}
