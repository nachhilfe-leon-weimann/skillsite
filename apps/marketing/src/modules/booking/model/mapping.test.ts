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

const responses = (submission: BookingSubmission) =>
  buildCalBookingBody(submission).bookingFieldsResponses as Record<
    string,
    unknown
  >;

test("a paid lesson with the express request to start early ticks Cal.com's policies-accepted", () => {
  assert.equal(responses(lesson())["policies-accepted"], true);
});

test("without the express request to start early, Cal.com's policies-accepted stays unset, even with accepted terms", () => {
  // Cal.com's confirmation e-mail repeats that field's label: it must never
  // show a request the customer did not make.
  for (const earlyPerformanceRequested of [false, "true", undefined]) {
    const sent = responses(
      lesson({
        agreements: { termsAccepted: true, earlyPerformanceRequested },
      }),
    );
    assert.equal("policies-accepted" in sent, false);
  }
});

test("a paid lesson's metadata holds exactly what the privacy policy names", () => {
  // datenschutz.tsx, Cal.com: the accepted terms, the express request, the AGB version.
  assert.deepEqual(Object.keys(metadata(lesson())).sort(), [
    "agbVersion",
    "earlyPerformanceRequested",
    "termsAccepted",
  ]);
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

test("the metadata records terms that were not accepted as such", () => {
  const recorded = metadata(
    lesson({
      agreements: { termsAccepted: false, earlyPerformanceRequested: false },
    }),
  );
  assert.equal(recorded.termsAccepted, "false");
  assert.equal(recorded.earlyPerformanceRequested, "false");
});

test("a lesson asks Cal.com for the chosen length", () => {
  assert.equal(buildCalBookingBody(lesson()).lengthInMinutes, 45);
});
