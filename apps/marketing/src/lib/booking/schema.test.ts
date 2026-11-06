import assert from "node:assert/strict";
import { test } from "vitest";

import { FIELD_LIMITS, type BookingSubmission } from "@/lib/booking/config";
import {
  checkBookingSubmission,
  MalformedSubmissionError,
} from "@/lib/booking/schema";
import { validateBookingValues } from "@/lib/booking/validation";

const firstMeeting = {
  firstName: "Max",
  lastName: "Muster",
  email: "max@example.com",
  phone: "+49 151 234567",
  subjects: ["Mathematik"],
  note: "",
};

const lesson = {
  firstName: "Max",
  lastName: "Muster",
  email: "max@example.com",
  location: "discord-video",
  subject: "Mathematik",
  note: "",
};

const missingInFirstMeeting = (change: Record<string, unknown>) =>
  validateBookingValues("kennenlernen", {
    ...firstMeeting,
    ...change,
  } as never);

const missingInLesson = (change: Record<string, unknown>) =>
  validateBookingValues("nachhilfe", { ...lesson, ...change } as never);

test("a complete form has nothing left to fill", () => {
  assert.deepEqual(missingInFirstMeeting({}), []);
  assert.deepEqual(missingInLesson({}), []);
});

test("a required field left blank, or only spaces, is still open", () => {
  for (const firstName of ["", "   ", undefined]) {
    assert.deepEqual(missingInFirstMeeting({ firstName }), ["Vorname"]);
  }
});

test("an optional note may stay empty", () => {
  for (const note of ["", "   ", undefined]) {
    assert.deepEqual(missingInLesson({ note }), []);
  }
});

test("text up to its limit is accepted, one character more is not", () => {
  const limits = [
    ["firstName", FIELD_LIMITS.name, "Vorname"],
    ["note", FIELD_LIMITS.note, "Zusätzliche Notizen"],
  ] as const;
  for (const [key, limit, label] of limits) {
    assert.deepEqual(missingInLesson({ [key]: "a".repeat(limit) }), []);
    assert.deepEqual(missingInLesson({ [key]: "a".repeat(limit + 1) }), [
      label,
    ]);
  }
  const atLimit = `${"a".repeat(FIELD_LIMITS.email - 12)}@example.com`;
  assert.deepEqual(missingInLesson({ email: atLimit }), []);
  assert.deepEqual(missingInLesson({ email: `a${atLimit}` }), ["E-Mail"]);
});

test("an e-mail address needs an @ and a domain with a dot", () => {
  assert.deepEqual(missingInLesson({ email: "  max@example.com  " }), []);
  for (const email of [
    "max@example",
    "max.example.com",
    "max mu@example.com",
  ]) {
    assert.deepEqual(missingInLesson({ email }), ["E-Mail"]);
  }
});

test("a phone number needs at least six digits", () => {
  assert.deepEqual(missingInFirstMeeting({ phone: "12345" }), [
    "Telefonnummer",
  ]);
  assert.deepEqual(missingInFirstMeeting({ phone: "123456" }), []);
  assert.deepEqual(missingInFirstMeeting({ phone: "+49 (0) 151/23-45" }), []);
  assert.deepEqual(missingInFirstMeeting({ phone: "0151 abc 234567" }), [
    "Telefonnummer",
  ]);
});

test("a choice that is not offered is rejected", () => {
  assert.deepEqual(missingInLesson({ subject: "Latein" }), ["Fach"]);
  assert.deepEqual(missingInLesson({ location: "zoom" }), ["Plattform"]);
  assert.deepEqual(missingInFirstMeeting({ subjects: ["Latein"] }), ["Fächer"]);
});

test("several subjects pass only when every one is offered", () => {
  assert.deepEqual(
    missingInFirstMeeting({ subjects: ["Mathematik", "Physik"] }),
    [],
  );
  assert.deepEqual(
    missingInFirstMeeting({ subjects: ["Mathematik", "Latein"] }),
    ["Fächer"],
  );
  assert.deepEqual(missingInFirstMeeting({ subjects: [] }), ["Fächer"]);
});

test("open fields are listed in the order of the form", () => {
  assert.deepEqual(
    missingInFirstMeeting({
      subjects: [],
      email: "",
      firstName: "",
      phone: "",
      lastName: "",
    }),
    ["Vorname", "Nachname", "E-Mail", "Telefonnummer", "Fächer"],
  );
  assert.deepEqual(missingInLesson({ subject: "", location: "" }), [
    "Plattform",
    "Fach",
  ]);
});

const NOW = Date.parse("2026-11-05T10:00:00.000Z");
const FAR_SLOT = "2027-03-02T09:00:00.000Z";
const NEAR_SLOT = "2026-11-07T09:00:00.000Z";

const lessonSubmission = (
  change: Partial<Record<keyof BookingSubmission, unknown>> = {},
) =>
  ({
    event: "nachhilfe",
    slot: FAR_SLOT,
    duration: 60,
    values: lesson,
    agreements: { termsAccepted: true, earlyPerformanceRequested: false },
    fillDurationMs: 5_000,
    ...change,
  }) as BookingSubmission;

const check = (change?: Partial<Record<keyof BookingSubmission, unknown>>) =>
  checkBookingSubmission(lessonSubmission(change), NOW);

test("a complete paid booking passes", () => {
  assert.equal(check(), null);
  assert.equal(
    check({
      slot: NEAR_SLOT,
      agreements: { termsAccepted: true, earlyPerformanceRequested: true },
    }),
    null,
  );
});

test("an unknown event or a missing slot asks for a slot", () => {
  for (const change of [
    { event: "probe" },
    { event: "toString" },
    { slot: "" },
    { slot: undefined },
  ]) {
    assert.deepEqual(check(change), { check: "slot" });
  }
});

test("missing fields are named with the form's labels", () => {
  assert.deepEqual(check({ values: { ...lesson, email: "", subject: "" } }), {
    check: "fields",
    fields: ["E-Mail", "Fach"],
  });
});

test("a paid lesson without accepted terms is turned down", () => {
  for (const agreements of [
    undefined,
    { termsAccepted: false, earlyPerformanceRequested: true },
  ]) {
    assert.deepEqual(check({ agreements }), { check: "terms" });
  }
});

test("a lesson within the withdrawal period needs the early start confirmed", () => {
  assert.deepEqual(check({ slot: NEAR_SLOT }), { check: "withdrawal_notice" });
});

test("the free first meeting never needs agreements", () => {
  assert.equal(
    checkBookingSubmission(
      {
        event: "kennenlernen",
        slot: NEAR_SLOT,
        values: firstMeeting,
        fillDurationMs: 5_000,
      },
      NOW,
    ),
    null,
  );
});

test("the checks run in order: slot, fields, terms, withdrawal notice", () => {
  assert.deepEqual(
    check({ slot: "", values: { ...lesson, email: "" }, agreements: {} }),
    { check: "slot" },
  );
  assert.deepEqual(
    check({
      slot: NEAR_SLOT,
      values: { ...lesson, email: "" },
      agreements: {},
    }),
    { check: "fields", fields: ["E-Mail"] },
  );
  assert.deepEqual(check({ slot: NEAR_SLOT, agreements: {} }), {
    check: "terms",
  });
});

test("a shape no form sends is reported as malformed", () => {
  for (const change of [
    { values: null },
    { values: undefined },
    { values: { ...lesson, firstName: 5 } },
  ]) {
    assert.throws(() => check(change), MalformedSubmissionError);
  }
});
