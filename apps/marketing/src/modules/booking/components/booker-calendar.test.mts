import { afterEach, describe, expect, test, vi } from "vitest";

import { bookingWindow, monthKey, monthsBetween } from "./booker-calendar";
import { bookingToday, shownMonth } from "../model/dates";

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
  ])("opened at %s spans %s to %s", (now, startMonth, endMonth) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(now));
    expect(bookingWindow(shownMonth(bookingToday(), 0), 0, 3)).toEqual({
      startMonth,
      endMonth,
    });
  });

  test("is the shown month's offsets 0..max, across the year's end", () => {
    const january = { year: 2027, month: 1 };
    expect(bookingWindow(january, 2, 3)).toEqual({
      startMonth: "2026-11",
      endMonth: "2027-02",
    });
    expect(bookingWindow(january, 0, 3)).toEqual({
      startMonth: "2027-01",
      endMonth: "2027-04",
    });
    expect(bookingWindow({ year: 2026, month: 12 }, 3, 3)).toEqual({
      startMonth: "2026-09",
      endMonth: "2026-12",
    });
  });

  test("stays with the shown month when a Berlin month boundary passes", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // 30 November 23:50 in Berlin: Booker shows (and fetched) November.
    vi.setSystemTime(new Date("2026-11-30T22:50:00Z"));
    const shown = shownMonth(bookingToday(), 0);
    // 1 December 00:10 in Berlin, the page still open.
    vi.setSystemTime(new Date("2026-11-30T23:10:00Z"));
    const window = bookingWindow(shown, 0, 3);
    expect(window).toEqual({ startMonth: "2026-11", endMonth: "2027-02" });
    expect(window.startMonth).toBe(monthKey(shown));
  });
});
