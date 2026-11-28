import {
  BOOKING_EVENT_PATH,
  type ClientBookingEvent,
} from "../model/analytics";

/**
 * Send a funnel step to this site's server, which reports it to analytics.
 * A beacon: it never waits, never queues behind or ahead of the booking
 * request, and survives leaving the page. No analytics code runs here.
 */
export function reportBookingEvent(event: ClientBookingEvent): void {
  try {
    navigator.sendBeacon(BOOKING_EVENT_PATH, JSON.stringify(event));
  } catch {
    // No beacon support, or the browser refused it: the step goes uncounted.
  }
}
