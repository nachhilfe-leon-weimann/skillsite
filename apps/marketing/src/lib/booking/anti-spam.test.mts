import assert from "node:assert/strict";
import { test } from "vitest";

import { detectSpamSignal, withFillDuration } from "./anti-spam.ts";

const options = { minFillMs: 3_000 };

test("a clean human submission raises no signal", () => {
  assert.equal(
    detectSpamSignal({ honeypot: "", fillDurationMs: 30_000 }, options),
    null,
  );
  assert.equal(detectSpamSignal({ fillDurationMs: 3_000 }, options), null);
});

test("any value in the honeypot is a signal", () => {
  for (const honeypot of ["Muster GmbH", " ", "http://spam.example", 42, {}]) {
    assert.equal(
      detectSpamSignal({ honeypot, fillDurationMs: 30_000 }, options),
      "honeypot",
    );
  }
});

test("submitting faster than the threshold is a signal", () => {
  assert.equal(
    detectSpamSignal({ fillDurationMs: 2_999 }, options),
    "too_fast",
  );
  assert.equal(detectSpamSignal({ fillDurationMs: 0 }, options), "too_fast");
});

test("a missing or nonsensical fill duration is a signal", () => {
  for (const fillDurationMs of [undefined, null, "30000", NaN, Infinity, -1]) {
    assert.equal(detectSpamSignal({ fillDurationMs }, options), "no_timing");
  }
});

test("malformed submissions are handled without throwing", () => {
  for (const input of [null, undefined, "nope", 7]) {
    assert.equal(detectSpamSignal(input, options), "no_timing");
  }
});

test("the fill duration comes from the client's own clock only", () => {
  // Regression: the form used to send its mount *timestamp*, which the server
  // compared with its own clock. A device running 5 minutes fast then looked
  // like a negative fill time and every booking was dropped as spam.
  const clientClockSkewMs = 5 * 60_000;
  const formLoadedAt = 1_000_000 + clientClockSkewMs;
  const submittedAt = formLoadedAt + 30_000;

  const submission = withFillDuration({ formLoadedAt, slot: "x" }, submittedAt);

  assert.deepEqual(submission, { slot: "x", fillDurationMs: 30_000 });
  assert.equal(detectSpamSignal(submission, options), null);
});

test("a retry re-measures the duration, so a too-fast block is recoverable", () => {
  const draft = { formLoadedAt: 10_000 };

  const first = withFillDuration(draft, 11_200);
  assert.equal(detectSpamSignal(first, options), "too_fast");

  const retry = withFillDuration(draft, 16_000);
  assert.equal(retry.fillDurationMs, 6_000);
  assert.equal(detectSpamSignal(retry, options), null);
});

test("the fill duration is a non-negative integer", () => {
  assert.equal(
    withFillDuration({ formLoadedAt: 100.4 }, 3_456.9).fillDurationMs,
    3_357,
  );
  assert.equal(withFillDuration({ formLoadedAt: 500 }, 100).fillDurationMs, 0);
});
