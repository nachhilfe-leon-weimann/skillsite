import { createRateLimiter, type RateLimitResult } from "@/lib/rate-limit";

import { ANTI_SPAM } from "../model/config";

export { createRateLimiter, type RateLimitResult };

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
