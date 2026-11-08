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

// A Cal.com error that echoes synthetic personal data in every free-text spot:
// punctuation-adjacent words, a two-letter name, a quoted copy of the request,
// a third person's name and contact details.
const echoingError = {
  status: "error",
  error: {
    code: "BadRequestException",
    message:
      'Li Kundin (li.kundin@example.com, +49 170 0000000) wrote: "Rhabarberkuchen." Ask Otto Beispiel.',
    details: {
      attendee: { name: "Li Kundin", email: "li.kundin@example.com" },
      notes: "Rhabarberkuchen.",
    },
  },
  message: "Rhabarberkuchen, Li!",
};
const personal = [
  "Li",
  "Kundin",
  "li.kundin",
  "example.com",
  "170",
  "Rhabarberkuchen",
  "Otto",
  "Beispiel",
];

test("a Cal.com error leaves only its status and code, never its message", () => {
  const logged = redactCalError(400, JSON.stringify(echoingError));
  assert.deepEqual(logged, { status: 400, code: "BadRequestException" });
  for (const value of personal) {
    assert.ok(!JSON.stringify(logged).includes(value), value);
  }
});

test("a plain error string counts as the code", () => {
  assert.deepEqual(
    redactCalError(422, JSON.stringify({ error: "Unprocessable_Entity" })),
    { status: 422, code: "Unprocessable_Entity" },
  );
});

test("a code that is not a plain code is dropped", () => {
  for (const code of [
    "Li Kundin",
    "li.kundin@example.com",
    "x".repeat(65),
    42,
    "",
  ]) {
    assert.deepEqual(redactCalError(400, JSON.stringify({ error: { code } })), {
      status: 400,
    });
  }
});

test("a Cal.com error body that is not a JSON object logs only its status", () => {
  for (const body of [
    "<html>Bad Gateway for li.kundin@example.com</html>",
    "",
    "null",
    "[1]",
  ]) {
    assert.deepEqual(redactCalError(502, body), { status: 502 });
  }
});
