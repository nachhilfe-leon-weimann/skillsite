import assert from "node:assert/strict";
import { test } from "vitest";

import {
  AvailabilityRateLimiter,
  availabilityClientId,
  resolveAvailabilityDuration,
} from "./availability-guard.ts";

test("duration accepts only the selected event's configured values", () => {
  const allowed = [45, 60, 90] as const;

  assert.equal(resolveAvailabilityDuration(null, 60, allowed), 60);
  assert.equal(resolveAvailabilityDuration("45", 60, allowed), 45);
  assert.equal(resolveAvailabilityDuration("60", 60, allowed), 60);
  assert.equal(resolveAvailabilityDuration("90", 60, allowed), 90);

  for (const rejected of [
    "",
    "1",
    "060",
    "60.0",
    "6e1",
    "0x3c",
    "+60",
    "Infinity",
    "NaN",
  ]) {
    assert.equal(resolveAvailabilityDuration(rejected, 60, allowed), null);
  }
});

test("fixed events accept only their default duration", () => {
  assert.equal(resolveAvailabilityDuration(null, 15, null), 15);
  assert.equal(resolveAvailabilityDuration("15", 15, null), 15);
  assert.equal(resolveAvailabilityDuration("60", 15, null), null);
});

test("client identity prefers the proxy chain and bounds the key", () => {
  assert.equal(
    availabilityClientId(
      new Headers({
        "x-forwarded-for": "203.0.113.4, 10.0.0.2",
        "x-real-ip": "198.51.100.2",
      }),
    ),
    "203.0.113.4",
  );
  assert.equal(
    availabilityClientId(new Headers({ "x-real-ip": "198.51.100.2" })),
    "198.51.100.2",
  );
  assert.equal(availabilityClientId(new Headers()), "unknown");
  assert.equal(
    availabilityClientId(new Headers({ "x-forwarded-for": "a".repeat(256) }))
      .length,
    128,
  );
});

test("rate limiter blocks the next request and resets after the window", () => {
  const limiter = new AvailabilityRateLimiter({
    maxAttempts: 3,
    windowMs: 1_000,
    maxClients: 10,
  });

  assert.deepEqual(limiter.check("client", 0), { ok: true });
  assert.deepEqual(limiter.check("client", 100), { ok: true });
  assert.deepEqual(limiter.check("client", 200), { ok: true });
  assert.deepEqual(limiter.check("client", 300), {
    ok: false,
    retryAfterMs: 700,
  });
  assert.deepEqual(limiter.check("client", 1_000), { ok: true });
});

test("rate limiter keeps client memory within its configured cap", () => {
  const limiter = new AvailabilityRateLimiter({
    maxAttempts: 2,
    windowMs: 1_000,
    maxClients: 2,
  });

  limiter.check("first", 0);
  limiter.check("second", 0);
  limiter.check("third", 0);

  assert.equal(limiter.trackedClients, 2);
  assert.deepEqual(limiter.check("first", 1), { ok: true });
  assert.equal(limiter.trackedClients, 2);
});
