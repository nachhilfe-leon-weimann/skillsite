import assert from "node:assert/strict";
import { afterEach, test, vi } from "vitest";

import { createWithdrawalLimiter } from "./rate-limit";

const HOUR = 60 * 60 * 1_000;

afterEach(() => {
  vi.useRealTimers();
});

const limiter = () =>
  createWithdrawalLimiter({
    perClient: { max: 2, windowMs: HOUR },
    overall: { max: 3, windowMs: HOUR },
    maxClients: 10,
  });

test("an address over its limit is refused until its window has passed", () => {
  const limit = limiter();
  assert.deepEqual(limit.check("192.0.2.1", 0), { ok: true });
  assert.deepEqual(limit.check("192.0.2.1", 1_000), { ok: true });
  assert.deepEqual(limit.check("192.0.2.1", 2_000), {
    ok: false,
    scope: "client",
  });
  assert.deepEqual(limit.check("192.0.2.1", HOUR + 1_000), { ok: true });
});

test("all addresses together are capped, without storing one more address", () => {
  const limit = limiter();
  for (const ip of ["192.0.2.1", "192.0.2.2", "192.0.2.3"]) {
    assert.deepEqual(limit.check(ip, 0), { ok: true });
  }
  assert.deepEqual(limit.check("192.0.2.4", 1), {
    ok: false,
    scope: "overall",
  });
  assert.equal(limit.trackedClients(), 3);
});

test("an address is forgotten once its window passed, without another request", () => {
  vi.useFakeTimers();
  const limit = limiter();
  limit.check("192.0.2.1", Date.now());
  assert.equal(limit.trackedClients(), 1);
  vi.advanceTimersByTime(HOUR - 1);
  assert.equal(limit.trackedClients(), 1);
  vi.advanceTimersByTime(1);
  assert.equal(limit.trackedClients(), 0);
});

test("at most maxClients addresses are kept; the oldest goes first", () => {
  const limit = createWithdrawalLimiter({
    perClient: { max: 2, windowMs: HOUR },
    overall: { max: 100, windowMs: HOUR },
    maxClients: 2,
  });
  limit.check("192.0.2.1", 0);
  limit.check("192.0.2.2", 1);
  limit.check("192.0.2.3", 2);
  assert.equal(limit.trackedClients(), 2);
  // The first address was pushed out, so it starts afresh.
  assert.deepEqual(limit.check("192.0.2.1", 3), { ok: true });
  assert.deepEqual(limit.check("192.0.2.1", 4), { ok: true });
});
