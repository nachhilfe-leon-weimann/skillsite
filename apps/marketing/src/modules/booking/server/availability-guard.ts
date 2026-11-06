export const AVAILABILITY_RATE_LIMIT = {
  maxAttempts: 30,
  windowMs: 60_000,
  maxClients: 2_048,
} as const;

type AvailabilityRateLimitOptions = {
  readonly maxAttempts: number;
  readonly windowMs: number;
  readonly maxClients: number;
};

export type AvailabilityRateLimitResult =
  { ok: true } | { ok: false; retryAfterMs: number };

/**
 * Resolve the public duration query without accepting alternate number syntax
 * or values that the selected event does not offer.
 */
export function resolveAvailabilityDuration(
  rawDuration: string | null,
  defaultDuration: number,
  configuredDurations: readonly number[] | null,
): number | null {
  if (rawDuration === null) return defaultDuration;
  if (!/^(0|[1-9]\d*)$/.test(rawDuration)) return null;

  const duration = Number(rawDuration);
  const allowedDurations = configuredDurations ?? [defaultDuration];
  return allowedDurations.includes(duration) ? duration : null;
}

/**
 * Derive the client identity set by Traefik while keeping attacker-controlled
 * header size from becoming attacker-controlled map memory.
 */
export function availabilityClientId(headers: Headers): string {
  const normalize = (value: string | null) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed.slice(0, 128) : null;
  };

  const forwarded = headers.get("x-forwarded-for")?.split(",", 1)[0] ?? null;
  return (
    normalize(forwarded) ?? normalize(headers.get("x-real-ip")) ?? "unknown"
  );
}

/**
 * Bounded, per-process sliding-window limiter. Production currently runs one
 * app replica; multiple replicas should replace this with a shared edge/store
 * limiter. Oldest client buckets are evicted once the explicit cap is reached.
 */
export class AvailabilityRateLimiter {
  private readonly attempts = new Map<string, number[]>();
  private readonly options: AvailabilityRateLimitOptions;

  constructor(options: AvailabilityRateLimitOptions = AVAILABILITY_RATE_LIMIT) {
    this.options = options;
  }

  get trackedClients(): number {
    return this.attempts.size;
  }

  check(
    clientId: string,
    now: number = Date.now(),
  ): AvailabilityRateLimitResult {
    const cutoff = now - this.options.windowMs;
    const recent = (this.attempts.get(clientId) ?? []).filter(
      (timestamp) => timestamp > cutoff,
    );

    if (recent.length >= this.options.maxAttempts) {
      this.store(clientId, recent, now);
      return {
        ok: false,
        retryAfterMs: Math.max(
          1,
          (recent[0] ?? now) + this.options.windowMs - now,
        ),
      };
    }

    recent.push(now);
    this.store(clientId, recent, now);
    return { ok: true };
  }

  private store(clientId: string, recent: number[], now: number): void {
    if (!this.attempts.has(clientId)) this.ensureCapacity(now);
    this.attempts.delete(clientId);
    this.attempts.set(clientId, recent);
  }

  private ensureCapacity(now: number): void {
    if (this.attempts.size < this.options.maxClients) return;

    const cutoff = now - this.options.windowMs;
    for (const [clientId, timestamps] of this.attempts) {
      if ((timestamps.at(-1) ?? 0) <= cutoff) this.attempts.delete(clientId);
    }

    while (this.attempts.size >= this.options.maxClients) {
      const oldestClient = this.attempts.keys().next().value;
      if (oldestClient === undefined) break;
      this.attempts.delete(oldestClient);
    }
  }
}
