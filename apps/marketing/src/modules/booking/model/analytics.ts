import type { BookingEventKey } from "./config";

/** Where the browser sends its funnel steps (`app/api/booking/event/route.ts`). */
export const BOOKING_EVENT_PATH = "/api/booking/event";

/**
 * A booking funnel step only the browser sees, which it sends as a beacon to
 * `BOOKING_EVENT_PATH`. The outcome of a booking the server answered
 * (`booking-confirmed`, `booking-failed` with the server's reason) is reported
 * by the server itself, once per attempt.
 */
export type ClientBookingEvent =
  /** The booking widget was opened. */
  | { name: "booking-started"; type: BookingEventKey }
  /** A time slot was chosen and the form opened. */
  | { name: "slot-selected"; type: BookingEventKey }
  /** The request never produced a result (offline, stale deployment): no server outcome exists. */
  | { name: "booking-failed"; type: BookingEventKey; reason: "request_error" };
