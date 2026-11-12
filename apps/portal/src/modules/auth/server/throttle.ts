/**
 * The login throttle (AH-6): at most `maxFailures` failed logins per client in `windowMs`; one more is refused
 * before it reaches SkillForge, and a successful login clears the client's count. SkillForge locks per account
 * only; this limits guessing across accounts.
 *
 * An attempt is counted when it starts, not when it fails: two logins sent at once cannot both slip under the
 * limit. An attempt that did not test the credentials (SkillForge unreachable, the portal misconfigured) is
 * forgiven afterwards.
 */

export const LOGIN_THROTTLE = {
  maxFailures: 10,
  windowMs: 15 * 60 * 1000,
  /** Most clients tracked at once. */
  maxClients: 1000,
} as const;

/** Longest client key kept: it will come from a request header. */
const MAX_CLIENT_KEY_LENGTH = 128;

/** A counted attempt, to forgive or to clear. */
export type ThrottleTicket = { readonly client: string; readonly at: number };

export type LoginThrottle = {
  /** Counts an attempt for `client`; `null` when the client is over the limit (nothing is counted then). */
  begin(client: string): ThrottleTicket | null;
  /** Takes back an attempt that did not test the credentials. */
  forgive(ticket: ThrottleTicket): void;
  /** A successful login: the client's count starts afresh. */
  clear(ticket: ThrottleTicket): void;
  trackedClients(): number;
};

export function createLoginThrottle({
  maxFailures = LOGIN_THROTTLE.maxFailures,
  windowMs = LOGIN_THROTTLE.windowMs,
  maxClients = LOGIN_THROTTLE.maxClients,
  now = Date.now,
}: {
  maxFailures?: number;
  windowMs?: number;
  maxClients?: number;
  now?: () => number;
} = {}): LoginThrottle {
  // Client -> attempt timestamps within the window. Ordered by the last counted attempt, oldest first.
  const attempts = new Map<string, number[]>();

  function recent(client: string, at: number): number[] {
    return (attempts.get(client) ?? []).filter(
      (timestamp) => at - timestamp < windowMs,
    );
  }

  function forgetExpired(at: number) {
    for (const [client, timestamps] of attempts) {
      const latest = timestamps.at(-1) ?? -Infinity;
      if (at - latest < windowMs) return;
      attempts.delete(client);
    }
  }

  return {
    begin(rawClient) {
      const at = now();
      const client = rawClient.slice(0, MAX_CLIENT_KEY_LENGTH);
      forgetExpired(at);
      const counted = recent(client, at);
      if (counted.length >= maxFailures) return null;

      counted.push(at);
      attempts.delete(client);
      while (attempts.size >= maxClients) {
        const oldest = attempts.keys().next().value;
        if (oldest === undefined) break;
        attempts.delete(oldest);
      }
      attempts.set(client, counted);
      return { client, at };
    },

    forgive({ client, at }) {
      const counted = attempts.get(client);
      if (!counted) return;
      const index = counted.indexOf(at);
      if (index !== -1) counted.splice(index, 1);
      if (counted.length === 0) attempts.delete(client);
    },

    clear({ client }) {
      attempts.delete(client);
    },

    trackedClients: () => attempts.size,
  };
}

/**
 * The client a login counts against. Until SS8 configures a trusted proxy header, the portal cannot tell clients
 * apart - a forwarded address could be forged - so every login shares one bucket.
 */
export function throttleClient(): string {
  return "shared";
}
