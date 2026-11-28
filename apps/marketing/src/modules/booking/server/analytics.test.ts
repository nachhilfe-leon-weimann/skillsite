import { afterEach, beforeEach, expect, test, vi } from "vitest";

const { createCalBooking, afterResponse } = vi.hoisted(() => ({
  createCalBooking: vi.fn(),
  afterResponse: [] as (() => unknown)[],
}));

// Every request is a visitor on the live host; the rate limit never interferes.
let request = 0;
let referer: string | undefined;
const visitorHeaders = () =>
  new Headers({
    host: "nachhilfe.leonweimann.de",
    "cf-connecting-ip": `192.0.2.${(request += 1)}`,
    "user-agent": "Mozilla/5.0 TestBrowser/1.0",
    ...(referer && { referer }),
  });
vi.mock("next/headers", () => ({ headers: async () => visitorHeaders() }));
vi.mock("next/cache", () => ({ updateTag: () => {} }));
// `after()` needs a request scope: collect the callbacks and run them by hand.
vi.mock("next/server", () => ({
  after: (callback: () => unknown) => afterResponse.push(callback),
}));
vi.mock("./cal-client", () => ({ createCalBooking }));

import { requestBooking } from "./actions";
import { handleBookingEventRequest } from "./analytics";
import type { BookingSubmission } from "../model/config";

const firstMeeting = {
  event: "kennenlernen",
  slot: "2099-03-02T09:00:00.000Z",
  values: {
    firstName: "Max",
    lastName: "Muster",
    email: "max@example.com",
    phone: "+49 151 234567",
    subjects: ["Mathematik"],
  },
  fillDurationMs: 5_000,
} as BookingSubmission;

const umami = vi.fn(async () => new Response("{}", { status: 200 }));

/** The events sent to Umami once the responses are out, as `name` and `data`. */
async function sentEvents() {
  await Promise.all(afterResponse.splice(0).map((callback) => callback()));
  return umami.mock.calls.map((call) => {
    const { payload } = JSON.parse(
      String((call as unknown as [string, RequestInit])[1].body),
    ) as { payload: { name: string; data: unknown; url: string } };
    return { name: payload.name, data: payload.data, url: payload.url };
  });
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubGlobal("fetch", umami);
  createCalBooking.mockReset();
  createCalBooking.mockResolvedValue({ ok: true, uid: "uid-test" });
  for (const level of ["info", "warn", "error"] as const) {
    vi.spyOn(console, level).mockImplementation(() => {});
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  umami.mockClear();
  afterResponse.length = 0;
  referer = undefined;
});

test("a confirmed booking is reported once, with its type and duration, after the response", async () => {
  referer = "https://nachhilfe.leonweimann.de/kontakt";
  expect(await requestBooking(firstMeeting)).toEqual({ ok: true });
  // Nothing goes out before the response.
  expect(umami).not.toHaveBeenCalled();

  expect(await sentEvents()).toEqual([
    {
      name: "booking-confirmed",
      data: { type: "kennenlernen", duration: 15 },
      url: "/kontakt",
    },
  ]);
});

test("a confirmed lesson is reported with the duration that was booked", async () => {
  const lesson = {
    event: "nachhilfe",
    slot: "2099-03-02T09:00:00.000Z",
    duration: 90,
    values: {
      firstName: "Max",
      lastName: "Muster",
      email: "max@example.com",
      location: "discord-video",
      subject: "Mathematik",
    },
    agreements: { termsAccepted: true, earlyPerformanceRequested: false },
    fillDurationMs: 5_000,
  } as BookingSubmission;
  expect(await requestBooking(lesson)).toEqual({ ok: true });
  expect(await sentEvents()).toEqual([
    {
      name: "booking-confirmed",
      data: { type: "nachhilfe", duration: 90 },
      url: "/termin",
    },
  ]);
});

test("a failed booking is reported once, with the server's reason", async () => {
  createCalBooking.mockResolvedValue({
    ok: false,
    slotTaken: true,
    failure: "slot_taken",
  });
  await requestBooking(firstMeeting);
  createCalBooking.mockRejectedValue(new Error("boom"));
  await requestBooking(firstMeeting);
  await requestBooking({ ...firstMeeting, values: {} } as BookingSubmission);

  expect(await sentEvents()).toEqual([
    {
      name: "booking-failed",
      data: { type: "kennenlernen", reason: "slot_taken" },
      url: "/kontakt",
    },
    {
      name: "booking-failed",
      data: { type: "kennenlernen", reason: "generic" },
      url: "/kontakt",
    },
    {
      name: "booking-failed",
      data: { type: "kennenlernen", reason: "validation" },
      url: "/kontakt",
    },
  ]);
});

test("an attempt without an offered booking type is not reported", async () => {
  await requestBooking({ ...firstMeeting, event: "probe" } as never);
  await requestBooking(null as never);
  expect(await sentEvents()).toEqual([]);
});

test("an unreachable Umami never changes the booking's answer", async () => {
  umami.mockRejectedValue(new TypeError("fetch failed"));
  expect(await requestBooking(firstMeeting)).toEqual({ ok: true });
  await expect(sentEvents()).resolves.toBeDefined();
  umami.mockReset();
  umami.mockImplementation(async () => new Response("{}", { status: 200 }));
});

/** A beacon from the booker, as the browser sends it. */
async function beacon(body: unknown) {
  const response = await handleBookingEventRequest(
    new Request("https://nachhilfe.leonweimann.de/api/booking/event", {
      method: "POST",
      headers: visitorHeaders(),
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
  // The browser never reads the answer; it is the same whatever was sent.
  expect(response.status).toBe(204);
}

test("the browser may report its funnel steps and a request that got no answer", async () => {
  await beacon({ name: "booking-started", type: "nachhilfe" });
  await beacon({ name: "slot-selected", type: "kennenlernen" });
  await beacon({
    name: "booking-failed",
    type: "nachhilfe",
    reason: "request_error",
  });

  expect(await sentEvents()).toEqual([
    { name: "booking-started", data: { type: "nachhilfe" }, url: "/termin" },
    { name: "slot-selected", data: { type: "kennenlernen" }, url: "/kontakt" },
    {
      name: "booking-failed",
      data: { type: "nachhilfe", reason: "request_error" },
      url: "/termin",
    },
  ]);
});

test("anything else the browser sends is dropped, and extra fields are stripped", async () => {
  // The server reports these itself; the browser cannot count them again.
  await beacon({ name: "booking-confirmed", type: "nachhilfe", duration: 60 });
  await beacon({
    name: "booking-failed",
    type: "nachhilfe",
    reason: "slot_taken",
  });
  await beacon({ name: "page-view", type: "nachhilfe" });
  await beacon({ name: "booking-started", type: "probe" });
  await beacon({ name: "booking-started" });
  await beacon("booking-started");
  await beacon("not json");
  await beacon(null);
  await beacon({
    name: "booking-started",
    type: "nachhilfe",
    padding: "x".repeat(1_000),
  });
  expect(await sentEvents()).toEqual([]);

  await beacon({
    name: "booking-started",
    type: "nachhilfe",
    email: "max@example.com",
  });
  expect(await sentEvents()).toEqual([
    { name: "booking-started", data: { type: "nachhilfe" }, url: "/termin" },
  ]);
});
