import assert from "node:assert/strict";
import { beforeEach, test, vi } from "vitest";

import { ANTI_SPAM } from "../model/config";
import { createRateLimiter } from "./rate-limit";

const { short, daily } = ANTI_SPAM.rateLimit;
const MINUTE = 60_000;

// The booking action's limiter lives at module scope: every test imports a fresh copy of the module.
beforeEach(() => {
  vi.resetModules();
});
const freshCheckRateLimit = async () =>
  (await import("./rate-limit")).checkRateLimit;

test("an address may try four times in ten minutes, then waits for the oldest attempt to age out", async () => {
  const checkRateLimit = await freshCheckRateLimit();
  const ip = "192.0.2.10";
  for (let attempt = 0; attempt < short.max; attempt += 1) {
    assert.deepEqual(checkRateLimit(ip, attempt * MINUTE), { ok: true });
  }
  assert.deepEqual(checkRateLimit(ip, 5 * MINUTE), {
    ok: false,
    retryAfterMs: short.windowMs - 5 * MINUTE,
  });
  assert.deepEqual(checkRateLimit(ip, short.windowMs), { ok: true });
});

test("an address may try fifteen times a day", async () => {
  const checkRateLimit = await freshCheckRateLimit();
  const ip = "192.0.2.11";
  // Spread out, so the ten-minute window never counts more than one.
  const at = (attempt: number) => attempt * short.windowMs;
  for (let attempt = 0; attempt < daily.max; attempt += 1) {
    assert.deepEqual(checkRateLimit(ip, at(attempt)), { ok: true });
  }
  const refused = checkRateLimit(ip, at(daily.max));
  assert.equal(refused.ok, false);
  assert.deepEqual(checkRateLimit(ip, daily.windowMs), { ok: true });
});

test("a refused attempt does not count against the address", async () => {
  const checkRateLimit = await freshCheckRateLimit();
  const ip = "192.0.2.12";
  for (let attempt = 0; attempt < short.max; attempt += 1) {
    checkRateLimit(ip, 0);
  }
  for (let retry = 1; retry <= 20; retry += 1) {
    assert.equal(checkRateLimit(ip, retry * 1_000).ok, false);
  }
  assert.deepEqual(checkRateLimit(ip, short.windowMs), { ok: true });
});

test("the tracked addresses never exceed the bound", () => {
  const limiter = createRateLimiter({
    windows: [{ max: 1, windowMs: 1_000 }],
    maxClients: 3,
  });
  for (let client = 0; client < 10; client += 1) {
    assert.deepEqual(limiter.check(`198.51.100.${client}`, client), {
      ok: true,
    });
    assert.ok(limiter.trackedClients() <= 3);
  }
  assert.equal(limiter.trackedClients(), 3);
});

test("an address is forgotten once its attempts have left the longest window", () => {
  const limiter = createRateLimiter({
    windows: [{ max: 1, windowMs: 1_000 }],
    maxClients: 10,
  });
  limiter.check("earlier", 0);
  limiter.check("later", 500);
  assert.equal(limiter.trackedClients(), 2);

  limiter.check("newcomer", 1_000);
  assert.equal(limiter.trackedClients(), 2);
  assert.deepEqual(limiter.check("later", 1_100), {
    ok: false,
    retryAfterMs: 400,
  });
});

test("at the bound, the address whose last recorded attempt is oldest makes room", () => {
  const limiter = createRateLimiter({
    windows: [{ max: 1, windowMs: 1_000 }],
    maxClients: 2,
  });
  assert.deepEqual(limiter.check("first", 0), { ok: true });
  assert.deepEqual(limiter.check("second", 100), { ok: true });
  // A refused retry records nothing: "first" stays the oldest.
  assert.equal(limiter.check("first", 500).ok, false);

  assert.deepEqual(limiter.check("third", 600), { ok: true });
  assert.equal(limiter.trackedClients(), 2);
  assert.equal(limiter.check("second", 700).ok, false);
  assert.equal(limiter.check("third", 700).ok, false);
  // "first" was dropped, so it starts afresh.
  assert.deepEqual(limiter.check("first", 800), { ok: true });
});

test("a recorded attempt keeps an address longer than one seen first", () => {
  const limiter = createRateLimiter({
    windows: [{ max: 2, windowMs: 1_000 }],
    maxClients: 10,
  });
  limiter.check("a", 0);
  limiter.check("b", 500);
  assert.deepEqual(limiter.check("a", 900), { ok: true });

  // "b" is forgotten at 1,500 although "a" was seen first: "a" recorded at 900.
  limiter.check("c", 1_600);
  assert.equal(limiter.trackedClients(), 2);
  assert.deepEqual(limiter.check("a", 1_700), { ok: true });
  assert.equal(limiter.check("a", 1_750).ok, false);
});

test("a recorded attempt of a known address pushes no other address out", () => {
  const limiter = createRateLimiter({
    windows: [{ max: 2, windowMs: 1_000 }],
    maxClients: 3,
  });
  limiter.check("a", 0);
  limiter.check("b", 100);
  limiter.check("c", 150);
  assert.deepEqual(limiter.check("b", 200), { ok: true });

  assert.equal(limiter.trackedClients(), 3);
  // "a" still counts its attempt at 0.
  assert.deepEqual(limiter.check("a", 250), { ok: true });
  assert.equal(limiter.check("a", 260).ok, false);
});

test("an oversized address header is tracked under a bounded key", () => {
  const limiter = createRateLimiter({
    windows: [{ max: 1, windowMs: 1_000 }],
    maxClients: 10,
  });
  const forged = "x".repeat(10_000);
  assert.deepEqual(limiter.check(`${forged}a`, 0), { ok: true });
  // Same first 128 characters: the same client.
  assert.equal(limiter.check(`${forged}b`, 1).ok, false);
  assert.equal(limiter.trackedClients(), 1);
});
