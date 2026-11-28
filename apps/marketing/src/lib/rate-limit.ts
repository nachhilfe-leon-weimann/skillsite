import "server-only";

import { SWEEP_INTERVAL_MS, createSweeper } from "./sweeper";

/**
 * The per-client rate limiter of the public form actions (booking, withdrawal).
 * Client addresses live only in this process's memory.
 */

export type RateLimitResult =
  { ok: true } | { ok: false; retryAfterMs: number };

type RateLimitWindow = { readonly max: number; readonly windowMs: number };

type RateLimitOptions = {
  readonly windows: readonly RateLimitWindow[];
  /** Most client addresses tracked at once. */
  readonly maxClients: number;
};

/** Longest client key kept: the address comes from a request header. */
const MAX_CLIENT_KEY_LENGTH = 128;

/**
 * A per-client limiter over several sliding windows, holding at most
 * `maxClients` addresses. An address is forgotten once its last recorded attempt
 * has left the longest window - it would start afresh anyway. That happens on
 * every `check()` and on a periodic sweep (`SWEEP_INTERVAL_MS`). The sweep looks
 * one interval ahead, so an address is held at most the longest window after its
 * last recorded attempt, with or without further traffic. The trade-off: once
 * that attempt is within one interval of the longest window, the sweep may forget
 * the address up to one interval early, so the longest window may count slightly
 * fewer attempts then (shorter windows are untouched). At the bound, a
 * new address then pushes out the one whose last recorded attempt is the oldest.
 * Below the bound, nothing that still counts is dropped. Module scope persists
 * per Node process, so this is correct only for a single replica; scaling to >1
 * needs a shared store.
 */
export function createRateLimiter({ windows, maxClients }: RateLimitOptions) {
  // Address -> recent attempt timestamps (ms). Ordered by the last recorded
  // attempt, oldest first: a recorded attempt moves its address to the end, a
  // refused one leaves it in place.
  const attempts = new Map<string, number[]>();
  const longestWindowMs = Math.max(...windows.map((window) => window.windowMs));

  function forgetExpired(now: number) {
    for (const [client, timestamps] of attempts) {
      const latest = timestamps.at(-1) ?? -Infinity;
      if (now - latest < longestWindowMs) return;
      attempts.delete(client);
    }
  }

  // The sweep reuses `forgetExpired` and looks one interval ahead, so no address
  // outlives the longest window; it starts with the first recorded address.
  const sweeper = createSweeper({
    sweep: () => forgetExpired(Date.now() + SWEEP_INTERVAL_MS),
    isEmpty: () => attempts.size === 0,
  });

  function record(client: string, recent: number[]) {
    if (attempts.has(client)) attempts.delete(client);
    while (attempts.size >= maxClients) {
      const oldest = attempts.keys().next().value;
      if (oldest === undefined) break;
      attempts.delete(oldest);
    }
    attempts.set(client, recent);
  }

  return {
    /**
     * Records an attempt for `ip` and reports whether it stays within every
     * window. Rejected attempts are not recorded. `now` is injectable for testing.
     */
    check(ip: string, now: number = Date.now()): RateLimitResult {
      forgetExpired(now);
      const client = ip.slice(0, MAX_CLIENT_KEY_LENGTH);
      const recent = (attempts.get(client) ?? []).filter(
        (timestamp) => now - timestamp < longestWindowMs,
      );

      for (const window of windows) {
        const inWindow = recent.filter(
          (timestamp) => now - timestamp < window.windowMs,
        );
        if (inWindow.length >= window.max) {
          // Over the limit: keep the pruned list in place, don't record this attempt.
          attempts.set(client, recent);
          sweeper.ensureRunning();
          const oldest = Math.min(...inWindow);
          return { ok: false, retryAfterMs: window.windowMs - (now - oldest) };
        }
      }

      recent.push(now);
      record(client, recent);
      sweeper.ensureRunning();
      return { ok: true };
    },
    trackedClients: () => attempts.size,
  };
}
