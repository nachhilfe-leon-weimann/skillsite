import { afterEach, describe, expect, test, vi } from "vitest";

import {
  bookingWindow,
  monthKey,
  monthsBetween,
} from "@/components/booking/booker-calendar";

afterEach(() => {
  vi.useRealTimers();
});

describe("month keys", () => {
  test("pad the month", () => {
    expect(monthKey({ year: 2026, month: 3 })).toBe("2026-03");
    expect(monthKey({ year: 2026, month: 12 })).toBe("2026-12");
  });

  test("count months across the year's end, both ways", () => {
    const december = { year: 2026, month: 12 };
    expect(monthsBetween(december, "2027-01")).toBe(1);
    expect(monthsBetween(december, "2027-02")).toBe(2);
    expect(monthsBetween(december, "2026-11")).toBe(-1);
    expect(monthsBetween(december, "2026-12")).toBe(0);
    expect(monthsBetween({ year: 2027, month: 1 }, "2026-12")).toBe(-1);
  });
});

describe("the booking window", () => {
  test.each([
    // Already the 1st in Berlin, still the previous month in UTC.
    ["2026-10-31T23:30:00Z", "2026-11", "2027-02"],
    ["2026-12-31T23:30:00Z", "2027-01", "2027-04"],
    ["2026-03-31T22:30:00Z", "2026-04", "2026-07"],
    // The last hour of a month in Berlin.
    ["2026-10-31T22:30:00Z", "2026-10", "2027-01"],
    ["2028-02-29T12:00:00Z", "2028-02", "2028-05"],
  ])("at %s spans %s to %s", (now, startMonth, endMonth) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(now));
    expect(bookingWindow(3)).toEqual({ startMonth, endMonth });
  });
});
