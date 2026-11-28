import { afterEach, expect, test, vi } from "vitest";

import { reportBookingEvent } from "./report-booking-event";

afterEach(() => {
  Reflect.deleteProperty(navigator, "sendBeacon");
});

test("a funnel step goes as a beacon to the site's own server", () => {
  const sendBeacon = vi.fn(() => true);
  Object.defineProperty(navigator, "sendBeacon", {
    value: sendBeacon,
    configurable: true,
  });

  reportBookingEvent({ name: "slot-selected", type: "nachhilfe" });

  expect(sendBeacon).toHaveBeenCalledExactlyOnceWith(
    "/api/booking/event",
    '{"name":"slot-selected","type":"nachhilfe"}',
  );
});

test("a browser without beacons loses the step, never the booking", () => {
  expect(() =>
    reportBookingEvent({ name: "booking-started", type: "kennenlernen" }),
  ).not.toThrow();
});
