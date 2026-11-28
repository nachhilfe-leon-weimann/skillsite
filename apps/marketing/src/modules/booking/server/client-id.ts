import { isIPv4, isIPv6 } from "node:net";

/** Longest client key kept: the address comes from a request header. */
const MAX_CLIENT_ID_LENGTH = 128;

/**
 * The visitor's address for the per-client rate limits. Production runs behind
 * the Cloudflare proxy, then Traefik (Dokploy):
 *
 * - `cf-connecting-ip` first: Cloudflare sets it to the visitor's address and
 *   overwrites any value the visitor sent. `x-forwarded-for` cannot replace it:
 *   if Traefik does not trust Cloudflare, it holds only the Cloudflare edge
 *   address, which many visitors share; if it does, it keeps Cloudflare's
 *   chain, whose first entry is whatever the visitor sent.
 * - Then the first `x-forwarded-for` entry and `x-real-ip`: Traefik sets both
 *   from the connecting peer. Without a proxy (local, `just docker-run`), Next.js
 *   fills `x-forwarded-for` from the socket unless the client sent one.
 *
 * The remaining risk: Traefik passes `cf-connecting-ip` through untouched, so a
 * request that reaches the server directly, not through Cloudflare, chooses its
 * own key. The limits hold only while the origin accepts nothing but Cloudflare
 * (authenticated origin pulls, or a firewall on Cloudflare's ranges).
 * An IPv6 address is keyed by its /64, the smallest block one subscriber gets
 * (one home network, one mobile device): otherwise a visitor could rotate
 * through it and start afresh on every request. A subscriber with a larger
 * block (a home line's /56, a tunnel broker's /48) can still rotate across its
 * /64s; a coarser key would lump unrelated mobile users together.
 * The key is bounded, so header size never becomes map memory.
 */
export function clientIdFromHeaders(headers: Headers): string {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-forwarded-for")?.split(",", 1)[0],
    headers.get("x-real-ip"),
  ];
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed)
      return ipv6Key(trimmed) ?? trimmed.slice(0, MAX_CLIENT_ID_LENGTH);
  }
  return "unknown";
}

/** The first six groups of the IPv6 forms that carry an IPv4 host in the last 32 bits. */
const IPV4_CARRYING_PREFIXES = [
  [0, 0, 0, 0, 0, 0xffff], // IPv4-mapped (`::ffff:0:0/96`), Node's socket form
  [0x64, 0xff9b, 0, 0, 0, 0], // NAT64 well-known prefix (`64:ff9b::/96`)
] as const;

/**
 * The rate-limit key of an IPv6 address: the IPv4 host it carries (mapped or
 * NAT64), else its /64 as `a:b:c:d::/64` (hex, no leading zeros); `null` for
 * anything that is not IPv6. A zone id (`%eth0`) is dropped.
 */
function ipv6Key(value: string): string | null {
  const address = value.split("%", 1)[0] ?? "";
  if (!isIPv6(address)) return null;

  const groups = expandIPv6(address);
  const carriesIPv4 = IPV4_CARRYING_PREFIXES.some((prefix) =>
    prefix.every((group, index) => groups[index] === group),
  );
  if (carriesIPv4) {
    const [high = 0, low = 0] = groups.slice(6);
    return [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
  }
  return `${groups
    .slice(0, 4)
    .map((group) => group.toString(16))
    .join(":")}::/64`;
}

/** The eight 16-bit groups of a valid IPv6 address, `::` and a dotted tail expanded. */
function expandIPv6(address: string): number[] {
  const toGroups = (part: string): number[] =>
    part === ""
      ? []
      : part.split(":").flatMap((piece) => {
          if (!isIPv4(piece)) return [Number.parseInt(piece, 16)];
          const [a = 0, b = 0, c = 0, d = 0] = piece.split(".").map(Number);
          return [(a << 8) | b, (c << 8) | d];
        });

  const [head = "", tail] = address.split("::");
  const headGroups = toGroups(head);
  if (tail === undefined) return headGroups;
  const tailGroups = toGroups(tail);
  const zeros = new Array<number>(
    8 - headGroups.length - tailGroups.length,
  ).fill(0);
  return [...headGroups, ...zeros, ...tailGroups];
}
