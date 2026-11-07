import { ANTI_SPAM } from "../model/config";

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
 * has left the longest window - it would start afresh anyway. At the bound, a
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
          const oldest = Math.min(...inWindow);
          return { ok: false, retryAfterMs: window.windowMs - (now - oldest) };
        }
      }

      recent.push(now);
      record(client, recent);
      return { ok: true };
    },
    trackedClients: () => attempts.size,
  };
}

const bookingLimiter = createRateLimiter({
  windows: [ANTI_SPAM.rateLimit.short, ANTI_SPAM.rateLimit.daily],
  maxClients: ANTI_SPAM.rateLimit.maxClients,
});

/**
 * The booking action's per-IP limit (`ANTI_SPAM.rateLimit`). Records an attempt
 * for `ip` and reports whether it stays within every window; rejected attempts
 * are not recorded. `now` is injectable for testing.
 */
export function checkRateLimit(
  ip: string,
  now: number = Date.now(),
): RateLimitResult {
  return bookingLimiter.check(ip, now);
}
