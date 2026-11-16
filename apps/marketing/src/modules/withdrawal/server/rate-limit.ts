import { WITHDRAWAL_ANTI_SPAM } from "../model/config";

type Window = { readonly max: number; readonly windowMs: number };

type LimiterOptions = {
  readonly perClient: Window;
  readonly overall: Window;
  /** Most client addresses tracked at once. */
  readonly maxClients: number;
};

export type LimitResult =
  { ok: true } | { ok: false; scope: "client" | "overall" };

/** Longest client key kept: the address comes from a request header. */
const MAX_CLIENT_KEY_LENGTH = 128;

/**
 * A sliding-window limit per client address plus one over all clients. An
 * address is forgotten by a timer once its last recorded attempt leaves the
 * window, so it is never kept longer than the window without traffic (the
 * overall count stores no address). At `maxClients`, a new address pushes out
 * the one whose last attempt is the oldest. Module scope persists per Node
 * process: correct for a single replica only.
 */
export function createWithdrawalLimiter({
  perClient,
  overall,
  maxClients,
}: LimiterOptions) {
  // Address -> its attempts (ms), ordered by the last attempt, oldest first.
  const clients = new Map<string, number[]>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  let everyone: number[] = [];

  function forget(client: string) {
    clients.delete(client);
    clearTimeout(timers.get(client));
    timers.delete(client);
  }

  function record(client: string, attempts: number[]) {
    forget(client);
    while (clients.size >= maxClients) {
      const oldest = clients.keys().next().value;
      if (oldest === undefined) break;
      forget(oldest);
    }
    clients.set(client, attempts);
    const timer = setTimeout(() => forget(client), perClient.windowMs);
    timer.unref?.();
    timers.set(client, timer);
  }

  return {
    /**
     * Records an attempt for `ip` when it stays within both limits; a refused
     * attempt is not recorded. `now` is injectable for testing.
     */
    check(ip: string, now: number = Date.now()): LimitResult {
      const client = ip.slice(0, MAX_CLIENT_KEY_LENGTH);
      const recent = (clients.get(client) ?? []).filter(
        (at) => now - at < perClient.windowMs,
      );
      everyone = everyone.filter((at) => now - at < overall.windowMs);

      if (recent.length >= perClient.max) return { ok: false, scope: "client" };
      if (everyone.length >= overall.max)
        return { ok: false, scope: "overall" };

      everyone.push(now);
      record(client, [...recent, now]);
      return { ok: true };
    },
    trackedClients: () => clients.size,
  };
}

const limiter = createWithdrawalLimiter(WITHDRAWAL_ANTI_SPAM.rateLimit);

/** The withdrawal action's limits (`WITHDRAWAL_ANTI_SPAM.rateLimit`). */
export function checkWithdrawalRateLimit(
  ip: string,
  now: number = Date.now(),
): LimitResult {
  return limiter.check(ip, now);
}
