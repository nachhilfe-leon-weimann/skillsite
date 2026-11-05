import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import type { BookingEventKey } from "../model/config";
import { MAX_MONTH_OFFSET, useAvailability } from "./use-availability";

/** One availability request the test answers by hand. */
type Request = {
  query: URLSearchParams;
  signal: AbortSignal;
  /** Answer with these free days (one 10:00 slot each). */
  answer: (days: string[]) => void;
  /** Answer with an HTTP error status. */
  fail: (status: number) => void;
};

let requests: Request[] = [];

/** A `fetch` that answers only when the test says so and honours aborts. */
function controllableFetch(url: string, init?: RequestInit) {
  return new Promise((resolve, reject) => {
    const signal = init?.signal as AbortSignal;
    signal.addEventListener("abort", () =>
      reject(new DOMException("The operation was aborted.", "AbortError")),
    );
    requests.push({
      query: new URL(url, "http://localhost").searchParams,
      signal,
      answer: (days) =>
        resolve({
          ok: true,
          status: 200,
          json: async () => ({
            status: "ok",
            timeZone: "Europe/Berlin",
            days: days.map((date) => ({
              date,
              slots: [{ time: "10:00", start: `${date}T10:00:00.000+01:00` }],
            })),
          }),
        }),
      fail: (status) =>
        resolve({ ok: false, status, json: async () => ({ error: "bad" }) }),
    });
  });
}

const month = (request: Request | undefined) =>
  `${request?.query.get("year")}-${request?.query.get("month")}`;

/** Let pending answers run through the hook's promise chain. */
const settle = () =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

type Props = {
  event: BookingEventKey;
  duration: number;
  onFirstFreeDay: (date: string) => void;
};

function renderAvailability(
  initial: Partial<Props> = {},
  options: { hydrate?: boolean; renderedToday?: string } = {},
) {
  const initialProps: Props = {
    event: "nachhilfe",
    duration: 60,
    onFirstFreeDay: vi.fn(),
    ...initial,
  };
  return renderHook(
    ({ event, duration, onFirstFreeDay }: Props) =>
      useAvailability(
        event,
        duration,
        onFirstFreeDay,
        options.renderedToday ?? "2026-11-05",
      ),
    { initialProps, hydrate: options.hydrate },
  );
}

beforeEach(() => {
  requests = [];
  // Only the clock is fake: the booking day is 5 November 2026 in Berlin.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-05T09:00:00Z"));
  vi.stubGlobal("fetch", vi.fn(controllableFetch));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("opening the booker asks for the current month exactly once", async () => {
  const { result } = renderAvailability();
  await settle();
  expect(requests).toHaveLength(1);
  expect(Object.fromEntries(requests[0]?.query ?? [])).toEqual({
    event: "nachhilfe",
    duration: "60",
    year: "2026",
    month: "11",
  });
  expect(result.current.loading).toBe(true);
});

test("a new first-day callback on a re-render asks nothing new, and it is the one called", async () => {
  const first = vi.fn();
  const second = vi.fn();
  const { rerender } = renderAvailability({ onFirstFreeDay: first });
  rerender({ event: "nachhilfe", duration: 60, onFirstFreeDay: second });
  await settle();
  expect(requests).toHaveLength(1);
  requests[0]?.answer(["2026-11-10"]);
  await settle();
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledWith("2026-11-10");
});

test("the soonest free day of the month is handed on once the month loads", async () => {
  const onFirstFreeDay = vi.fn();
  const { result } = renderAvailability({ onFirstFreeDay });
  requests[0]?.answer(["2026-11-10", "2026-11-25"]);
  await settle();
  expect(onFirstFreeDay).toHaveBeenCalledExactlyOnceWith("2026-11-10");
  expect(result.current.loading).toBe(false);
  expect(result.current.status).toBe("ok");
  expect(result.current.availability?.days.map((day) => day.date)).toEqual([
    "2026-11-10",
    "2026-11-25",
  ]);
});

test("empty months are skipped up to the last bookable month, and the search stops there", async () => {
  const onFirstFreeDay = vi.fn();
  const { result } = renderAvailability({ onFirstFreeDay });
  for (let offset = 0; offset <= MAX_MONTH_OFFSET; offset++) {
    await settle();
    requests[offset]?.answer([]);
  }
  await settle();
  expect(requests.map(month)).toEqual([
    "2026-11",
    "2026-12",
    "2027-1",
    "2027-2",
  ]);
  expect(result.current.monthOffset).toBe(MAX_MONTH_OFFSET);
  expect(result.current.shown).toEqual({ year: 2027, month: 2 });
  expect(result.current.loading).toBe(false);
  expect(onFirstFreeDay).not.toHaveBeenCalled();
});

test("a month the visitor opens stays open, even when it is empty", async () => {
  const { result } = renderAvailability();
  requests[0]?.answer(["2026-11-10"]);
  await settle();
  act(() => result.current.changeMonth(1));
  expect(result.current.loading).toBe(true);
  await settle();
  requests[1]?.answer([]);
  await settle();
  expect(requests.map(month)).toEqual(["2026-11", "2026-12"]);
  expect(result.current.monthOffset).toBe(1);
  expect(result.current.loading).toBe(false);
});

test("month changes stay between the current and the last bookable month", async () => {
  const { result } = renderAvailability();
  requests[0]?.answer(["2026-11-10"]);
  await settle();
  act(() => result.current.changeMonth(MAX_MONTH_OFFSET + 2));
  expect(result.current.monthOffset).toBe(MAX_MONTH_OFFSET);
  act(() => result.current.changeMonth(-(MAX_MONTH_OFFSET + 2)));
  expect(result.current.monthOffset).toBe(0);
});

test("a new search after manual navigation skips empty months again", async () => {
  const { result } = renderAvailability();
  requests[0]?.answer(["2026-11-10"]);
  await settle();
  act(() => result.current.changeMonth(1));
  await settle();
  requests[1]?.answer([]);
  await settle();
  act(() => result.current.restartSearch());
  expect(result.current.loading).toBe(true);
  await settle();
  requests[2]?.answer([]);
  await settle();
  expect(requests.map(month)).toEqual([
    "2026-11",
    "2026-12",
    "2026-12",
    "2027-1",
  ]);
});

test("a new duration cancels the pending request and ignores its late answer", async () => {
  const onFirstFreeDay = vi.fn();
  const { result, rerender } = renderAvailability({ onFirstFreeDay });
  rerender({ event: "nachhilfe", duration: 90, onFirstFreeDay });
  await settle();
  expect(requests).toHaveLength(2);
  expect(requests[0]?.signal.aborted).toBe(true);
  expect(requests[1]?.query.get("duration")).toBe("90");
  requests[1]?.answer(["2026-11-25"]);
  requests[0]?.answer(["2026-11-10"]);
  await settle();
  expect(onFirstFreeDay).toHaveBeenCalledExactlyOnceWith("2026-11-25");
  expect(result.current.availability?.days.map((day) => day.date)).toEqual([
    "2026-11-25",
  ]);
});

test("a failed request shows the error state", async () => {
  const { result } = renderAvailability();
  requests[0]?.fail(500);
  await settle();
  expect(result.current.status).toBe("error");
  expect(result.current.loading).toBe(false);
});

test("retrying after an error asks once more", async () => {
  const { result } = renderAvailability();
  requests[0]?.fail(400);
  await settle();
  act(() => result.current.retry());
  expect(result.current.loading).toBe(true);
  await settle();
  expect(requests.map(month)).toEqual(["2026-11", "2026-11"]);
  requests[1]?.answer(["2026-11-10"]);
  await settle();
  expect(result.current.status).toBe("ok");
});

test("a page rendered on an earlier day asks only for the visitor's month once hydrated", async () => {
  const { result } = renderAvailability(
    {},
    { hydrate: true, renderedToday: "2026-10-31" },
  );
  await settle();
  expect(requests.map(month)).toEqual(["2026-11"]);
  expect(result.current.today).toBe("2026-11-05");
  expect(result.current.shown).toEqual({ year: 2026, month: 11 });
});
