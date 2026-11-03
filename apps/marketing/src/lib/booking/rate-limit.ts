import { ANTI_SPAM } from "@/lib/booking/config";

export type RateLimitResult =
  { ok: true } | { ok: false; retryAfterMs: number };

// IP -> recent attempt timestamps (ms). Module scope persists per Node process,
// so this is correct only for a single replica; scaling to >1 needs a shared store.
const attempts = new Map<string, number[]>();

const WINDOWS = [ANTI_SPAM.rateLimit.short, ANTI_SPAM.rateLimit.daily];
const LONGEST_WINDOW_MS = Math.max(...WINDOWS.map((window) => window.windowMs));

/**
 * Records an attempt for `ip` and reports whether it stays within every window.
 * Rejected attempts are not recorded. `now` is injectable for testing.
 */
export function checkRateLimit(
  ip: string,
  now: number = Date.now(),
): RateLimitResult {
  const recent = (attempts.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < LONGEST_WINDOW_MS,
  );

  for (const window of WINDOWS) {
    const inWindow = recent.filter(
      (timestamp) => now - timestamp < window.windowMs,
    );
    if (inWindow.length >= window.max) {
      // Over the limit: keep the pruned list, don't record this attempt.
      attempts.set(ip, recent);
      const oldest = Math.min(...inWindow);
      return { ok: false, retryAfterMs: window.windowMs - (now - oldest) };
    }
  }

  recent.push(now);
  attempts.set(ip, recent);
  return { ok: true };
}
