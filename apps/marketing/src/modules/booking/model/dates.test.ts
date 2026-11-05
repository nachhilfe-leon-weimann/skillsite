import assert from "node:assert/strict";
import { test } from "vitest";

import { formatDateLabel } from "./dates";

test("a booking day reads as its German weekday, day and month", () => {
  assert.equal(formatDateLabel("2026-11-10"), "Di., 10. November");
  assert.equal(formatDateLabel("2027-03-29"), "Mo., 29. März");
});

test("the label keeps the day at the edges of a year", () => {
  assert.equal(formatDateLabel("2026-01-01"), "Do., 1. Januar");
  assert.equal(formatDateLabel("2026-12-31"), "Do., 31. Dezember");
});
