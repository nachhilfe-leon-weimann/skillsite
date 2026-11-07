import assert from "node:assert/strict";
import { test, vi } from "vitest";

import {
  describeAttempt,
  logBooking,
  maskEmail,
  redactCalError,
} from "./log.ts";

test("e-mail addresses are masked down to a recognisable hint", () => {
  assert.equal(maskEmail("test.kunde@example.com"), "te***@example.com");
  assert.equal(maskEmail("  a@example.com "), "a***@example.com");
  assert.equal(maskEmail("not-an-email"), undefined);
  assert.equal(maskEmail(""), undefined);
  assert.equal(maskEmail(["a@example.com"]), undefined);
  assert.equal(maskEmail(undefined), undefined);
});

test("an attempt is described without names, phone numbers or notes", () => {
  const context = describeAttempt({
    event: "kennenlernen",
    slot: "2026-10-07T14:00:00.000Z",
    duration: 60,
    values: {
      firstName: "Test",
      lastName: "Kunde",
      email: "test.kunde@example.com",
      phone: "+49 170 0000000",
      note: "private note",
    },
    honeypot: "",
    fillDurationMs: 30_000,
  });

  assert.deepEqual(context, {
    event: "kennenlernen",
    slot: "2026-10-07T14:00:00.000Z",
    duration: 60,
    attendee: "te***@example.com",
    fillDurationMs: 30_000,
  });
});

test("a filled honeypot is logged, bounded, as evidence", () => {
  assert.deepEqual(describeAttempt({ honeypot: "Muster GmbH" }), {
    honeypot: "Muster GmbH",
  });
  assert.deepEqual(describeAttempt({ honeypot: "x".repeat(500) }), {
    honeypot: "x".repeat(64),
  });
  assert.deepEqual(describeAttempt({ honeypot: 42 }), {});
});

test("describing a malformed attempt never throws", () => {
  assert.deepEqual(describeAttempt(null), {});
  assert.deepEqual(describeAttempt("nope"), {});
  assert.deepEqual(describeAttempt({ event: 5, slot: {}, values: "x" }), {});
  assert.deepEqual(describeAttempt({ event: "e".repeat(500) }), {
    event: "e".repeat(64),
  });
});

test("every outcome is one greppable line at the matching level", () => {
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const error = vi.spyOn(console, "error").mockImplementation(() => {});

  logBooking("created", { calUid: "abc" });
  logBooking("blocked", { signal: "honeypot", honeypot: "line\nbreak" });
  logBooking("failed", {});

  assert.deepEqual(info.mock.calls[0], ['[booking] created {"calUid":"abc"}']);
  // Untrusted input stays on one line - no forged log entries.
  assert.deepEqual(warn.mock.calls[0], [
    '[booking] blocked {"signal":"honeypot","honeypot":"line\\nbreak"}',
  ]);
  assert.deepEqual(error.mock.calls[0], ["[booking] failed {}"]);
});

// What the booking sent to Cal.com - synthetic attendee data.
const sentBooking = {
  start: "2099-03-02T09:00:00.000Z",
  eventTypeSlug: "nachhilfe-online",
  attendee: {
    name: "Testa Kundin",
    email: "testa.kundin@example.com",
    phoneNumber: "+491700000000",
    timeZone: "Europe/Berlin",
    language: "de",
  },
  bookingFieldsResponses: {
    name: { firstName: "Testa", lastName: "Kundin" },
    notes: "Bruchrechnung (a+b)*c vor der Klassenarbeit",
  },
};

test("a Cal.com error is logged with its status, code and message", () => {
  const body = JSON.stringify({
    status: "error",
    error: {
      code: "BadRequestException",
      message: "User either already has booking at this time",
    },
  });
  assert.deepEqual(redactCalError(400, body, sentBooking), {
    status: 400,
    code: "BadRequestException",
    message: "User either already has booking at this time",
  });
});

test("a Cal.com error never logs what the visitor entered", () => {
  const body = JSON.stringify({
    error: {
      code: "BadRequestException",
      message:
        "Testa Kundin <testa.kundin@example.com>, +491700000000: Bruchrechnung (a+b)*c vor der Klassenarbeit",
      details: { attendee: sentBooking.attendee },
    },
  });
  const logged = JSON.stringify(redactCalError(400, body, sentBooking));
  for (const value of [
    "Testa",
    "Kundin",
    "testa.kundin",
    "example.com",
    "1700000000",
    "Bruchrechnung",
    "(a+b)*c",
  ]) {
    assert.ok(!logged.includes(value), `${value} leaked into ${logged}`);
  }
  assert.match(logged, /"status":400/);
  assert.match(logged, /"code":"BadRequestException"/);
});

test("an e-mail address or phone number Cal.com echoes is never logged", () => {
  const body = JSON.stringify({
    message: ["other.person@example.org is invalid", "call 0151 2345 6789"],
    error: "Bad Request",
  });
  const logged = redactCalError(422, body, {});
  assert.equal(logged.status, 422);
  assert.equal(logged.code, "Bad Request");
  assert.ok(!JSON.stringify(logged).includes("other.person"));
  assert.ok(!JSON.stringify(logged).includes("2345"));
});

test("a Cal.com error body that is not JSON logs only its status", () => {
  assert.deepEqual(
    redactCalError(
      502,
      "<html>Bad Gateway for testa.kundin@example.com</html>",
      sentBooking,
    ),
    { status: 502 },
  );
  assert.deepEqual(redactCalError(500, "", sentBooking), { status: 500 });
});

test("a long Cal.com message is bounded", () => {
  const body = JSON.stringify({ error: { message: "x".repeat(500) } });
  assert.equal(redactCalError(400, body, {}).message?.length, 64);
});
