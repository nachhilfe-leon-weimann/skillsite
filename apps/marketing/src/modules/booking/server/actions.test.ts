import assert from "node:assert/strict";
import { beforeEach, test, vi } from "vitest";

const { createCalBooking } = vi.hoisted(() => ({
  createCalBooking: vi.fn(),
}));

// Every request comes from its own address, so the rate limit never interferes.
let request = 0;
vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({ "x-forwarded-for": `192.0.2.${(request += 1)}` }),
}));
vi.mock("next/cache", () => ({ updateTag: () => {} }));
vi.mock("./cal-client", () => ({ createCalBooking }));

import { requestBooking } from "./actions";
import type { BookingSubmission } from "../model/config";

const GENERIC_ERROR =
  "Die Buchung hat nicht geklappt. Bitte versuch es erneut oder schreib mir direkt.";

const firstMeeting = (values: unknown): BookingSubmission =>
  ({
    event: "kennenlernen",
    slot: "2099-03-02T09:00:00.000Z",
    values,
    fillDurationMs: 5_000,
  }) as BookingSubmission;

const validValues = {
  firstName: "Max",
  lastName: "Muster",
  email: "max@example.com",
  phone: "+49 151 234567",
  subjects: ["Mathematik"],
};

beforeEach(() => {
  createCalBooking.mockReset();
  createCalBooking.mockResolvedValue({ ok: true, uid: "uid-test" });
  for (const level of ["info", "warn", "error"] as const) {
    vi.spyOn(console, level).mockImplementation(() => {});
  }
});

test("a valid booking is forwarded to Cal.com and confirmed", async () => {
  assert.deepEqual(await requestBooking(firstMeeting(validValues)), {
    ok: true,
  });
  assert.equal(createCalBooking.mock.calls.length, 1);
});

test("missing fields are named and never reach Cal.com", async () => {
  assert.deepEqual(
    await requestBooking(firstMeeting({ ...validValues, email: "" })),
    {
      ok: false,
      reason: "validation",
      error: "Bitte überprüfe deine Eingaben: E-Mail.",
    },
  );
  assert.equal(createCalBooking.mock.calls.length, 0);
});

test("a paid lesson without accepted terms is never booked", async () => {
  const lesson = {
    event: "nachhilfe",
    slot: "2099-03-02T09:00:00.000Z",
    duration: 60,
    values: {
      firstName: "Max",
      lastName: "Muster",
      email: "max@example.com",
      location: "discord-video",
      subject: "Mathematik",
    },
    agreements: { termsAccepted: false, earlyPerformanceRequested: false },
    fillDurationMs: 5_000,
  } as BookingSubmission;
  assert.deepEqual(await requestBooking(lesson), {
    ok: false,
    reason: "validation",
    error: "Bitte bestätige die AGB.",
  });
  assert.equal(createCalBooking.mock.calls.length, 0);
});

test("only an offered event key reaches Cal.com", async () => {
  const lesson = (event: unknown) =>
    ({
      event,
      slot: "2099-03-02T09:00:00.000Z",
      duration: 60,
      values: {
        firstName: "Max",
        lastName: "Muster",
        email: "max@example.com",
        location: "discord-video",
        subject: "Mathematik",
      },
      agreements: { termsAccepted: false, earlyPerformanceRequested: false },
      fillDurationMs: 5_000,
    }) as BookingSubmission;
  const unknownEvent = await requestBooking(lesson("probe"));
  assert.deepEqual(unknownEvent, {
    ok: false,
    reason: "validation",
    error: "Bitte wähle einen Termin.",
  });
  assert.deepEqual(await requestBooking(lesson(["nachhilfe"])), unknownEvent);
  assert.equal(createCalBooking.mock.calls.length, 0);
});

test("a malformed submission ends in the generic failure without reaching Cal.com", async () => {
  for (const values of [null, { ...validValues, firstName: 5 }]) {
    assert.deepEqual(await requestBooking(firstMeeting(values)), {
      ok: false,
      reason: "generic",
      error: GENERIC_ERROR,
    });
  }
  assert.equal(createCalBooking.mock.calls.length, 0);
  assert.match(
    vi.mocked(console.error).mock.calls[0]?.[0] as string,
    /^\[booking\] failed .*"error":"MalformedSubmissionError: /,
  );
});
