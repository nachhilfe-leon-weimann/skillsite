import assert from "node:assert/strict";
import { test } from "vitest";

import type { BookingSubmission } from "./config";
import { buildCalBookingBody } from "./mapping";

// Synthetic attendee data.
const lesson = (change: Record<string, unknown> = {}) =>
  ({
    event: "nachhilfe",
    slot: "2099-03-02T09:00:00.000Z",
    duration: 45,
    values: {
      firstName: "Testa",
      lastName: "Kundin",
      email: "testa.kundin@example.com",
      location: "discord-video",
      subject: "Mathematik",
      note: "",
    },
    agreements: { termsAccepted: true, earlyPerformanceRequested: true },
    ...change,
  }) as BookingSubmission;

const metadata = (submission: BookingSubmission) =>
  buildCalBookingBody(submission).metadata as Record<string, string>;

test("a paid lesson tells Cal.com the policies were accepted", () => {
  const responses = buildCalBookingBody(lesson())
    .bookingFieldsResponses as Record<string, unknown>;
  assert.equal(responses["policies-accepted"], true);
});

test("a paid lesson records the confirmed agreements in Cal.com's metadata", () => {
  const recorded = metadata(lesson());
  assert.equal(recorded.termsAccepted, "true");
  assert.equal(recorded.earlyPerformanceRequested, "true");
  assert.match(recorded.agbVersion ?? "", /^\d{4}-\d{2}-\d{2}$/);
});

test("the metadata records the checked booleans, never a raw value that was sent", () => {
  const recorded = metadata(
    lesson({
      agreements: {
        termsAccepted: true,
        earlyPerformanceRequested: "<script>",
      },
    }),
  );
  assert.equal(recorded.termsAccepted, "true");
  assert.equal(recorded.earlyPerformanceRequested, "false");
});

test("the first meeting carries no agreements", () => {
  const body = buildCalBookingBody({
    event: "kennenlernen",
    slot: "2099-03-02T09:00:00.000Z",
    values: {
      firstName: "Testa",
      lastName: "Kundin",
      email: "testa.kundin@example.com",
      phone: "+49 170 0000000",
      subjects: ["Mathematik"],
    },
    agreements: { termsAccepted: true, earlyPerformanceRequested: true },
  });
  assert.equal(body.metadata, undefined);
  assert.equal(body.lengthInMinutes, undefined);
  const responses = body.bookingFieldsResponses as Record<string, unknown>;
  assert.equal("policies-accepted" in responses, false);
});

test("a lesson whose terms were not accepted gets no policies-accepted", () => {
  const body = buildCalBookingBody(
    lesson({
      agreements: { termsAccepted: false, earlyPerformanceRequested: true },
    }),
  );
  const responses = body.bookingFieldsResponses as Record<string, unknown>;
  assert.equal("policies-accepted" in responses, false);
  // The metadata still records what was (not) confirmed.
  assert.equal(
    (body.metadata as Record<string, string>).termsAccepted,
    "false",
  );
});

test("a lesson asks Cal.com for the chosen length", () => {
  assert.equal(buildCalBookingBody(lesson()).lengthInMinutes, 45);
});
