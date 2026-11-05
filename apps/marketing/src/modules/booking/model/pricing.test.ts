import assert from "node:assert/strict";
import { test } from "vitest";

import { bookingEvents } from "./config";
import { durationLabel, formatSlotPrice } from "./pricing";

const lesson = bookingEvents.nachhilfe;
const firstMeeting = bookingEvents.kennenlernen;

test("a lesson costs its share of the hourly price for each duration", () => {
  // German currency format: the amount and "€" are joined by a no-break space.
  assert.equal(formatSlotPrice(lesson, 45), "22,50 €");
  assert.equal(formatSlotPrice(lesson, 60), "30,00 €");
  assert.equal(formatSlotPrice(lesson, 90), "45,00 €");
});

test("the free first meeting shows no price", () => {
  assert.equal(
    formatSlotPrice(firstMeeting, firstMeeting.defaultDuration),
    null,
  );
});

test("a lesson names the chosen duration, the first meeting its fixed length", () => {
  assert.equal(durationLabel(lesson, 90), "90 Minuten");
  assert.equal(durationLabel(firstMeeting, 60), "15 Minuten");
});
