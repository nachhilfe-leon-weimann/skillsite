import { createRateLimiter, type RateLimitResult } from "@/lib/rate-limit";

import { WITHDRAWAL_ANTI_SPAM } from "../model/config";

const { perClient, overall, maxClients } = WITHDRAWAL_ANTI_SPAM.rateLimit;

const clientLimiter = createRateLimiter({ windows: [perClient], maxClients });

/** One key for every client: the overall count stores no address. */
const EVERYONE = "everyone";
const overallLimiter = createRateLimiter({ windows: [overall], maxClients: 1 });

/**
 * The key an address is limited by. An IPv6 host usually holds a whole /64,
 * so it counts as one client by that prefix; an IPv4 address (also when
 * IPv4-mapped) counts by itself.
 */
export function clientKey(ip: string): string {
  const address = ip.trim().toLowerCase();
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(address);
  if (mapped?.[1]) return mapped[1];
  if (!address.includes(":")) return address;

  const [head = "", tail] = address.split("::");
  const groups = head === "" ? [] : head.split(":");
  if (tail !== undefined) {
    const tailGroups = tail === "" ? [] : tail.split(":");
    const missing = Math.max(0, 8 - groups.length - tailGroups.length);
    groups.push(...Array<string>(missing).fill("0"), ...tailGroups);
  }
  return `${groups
    .slice(0, 4)
    .map((group) => group.replace(/^0+(?=.)/, "") || "0")
    .join(":")}::/64`;
}

/**
 * The per-client limit (`WITHDRAWAL_ANTI_SPAM.rateLimit.perClient`), checked
 * first and counting every attempt. `now` is injectable for testing.
 */
export function checkClientLimit(
  ip: string,
  now: number = Date.now(),
): RateLimitResult {
  return clientLimiter.check(clientKey(ip), now);
}

/**
 * The limit over all clients (`perClient`'s sibling `overall`), checked only
 * for a declaration about to be sent: junk requests never count against it.
 */
export function checkOverallLimit(now: number = Date.now()): RateLimitResult {
  return overallLimiter.check(EVERYONE, now);
}
