import {
  carriedIPv4,
  clientAddressFromHeaders,
  ipv6Groups,
} from "@/lib/client-address";

/** Longest client key kept: the address comes from a request header. */
const MAX_CLIENT_ID_LENGTH = 128;

/**
 * The visitor's key for the per-client rate limits: the address the headers
 * report (`clientAddressFromHeaders`, which documents the proxy chain and its
 * remaining risk), else `"unknown"`.
 *
 * An IPv6 address is keyed by its /64, the smallest block one subscriber gets
 * (one home network, one mobile device): otherwise a visitor could rotate
 * through it and start afresh on every request. A subscriber with a larger
 * block (a home line's /56, a tunnel broker's /48) can still rotate across its
 * /64s; a coarser key would lump unrelated mobile users together.
 * The key is bounded, so header size never becomes map memory.
 */
export function clientIdFromHeaders(headers: Headers): string {
  const address = clientAddressFromHeaders(headers);
  if (address === undefined) return "unknown";
  return ipv6Key(address) ?? address.slice(0, MAX_CLIENT_ID_LENGTH);
}

/**
 * The rate-limit key of an IPv6 address: the IPv4 host it carries (mapped or
 * NAT64), else its /64 as `a:b:c:d::/64` (hex, no leading zeros); `null` for
 * anything that is not IPv6. A zone id (`%eth0`) is dropped.
 */
function ipv6Key(value: string): string | null {
  const groups = ipv6Groups(value);
  if (!groups) return null;
  return (
    carriedIPv4(groups) ??
    `${groups
      .slice(0, 4)
      .map((group) => group.toString(16))
      .join(":")}::/64`
  );
}
