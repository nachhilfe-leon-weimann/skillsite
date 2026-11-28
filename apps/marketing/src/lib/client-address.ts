import { isIPv4, isIPv6 } from "node:net";

/**
 * The visitor's address as the request headers report it, for every server
 * part that needs it (the booking's rate limits, analytics). Production runs
 * behind the Cloudflare proxy, then Traefik (Dokploy):
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
 * own value. Whatever relies on it holds only while the origin accepts nothing
 * but Cloudflare (authenticated origin pulls, or a firewall on Cloudflare's ranges).
 *
 * Returns the first non-blank candidate, trimmed but otherwise as sent (it may
 * be no address at all), or `undefined` when no header names one.
 */
export function clientAddressFromHeaders(headers: Headers): string | undefined {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-forwarded-for")?.split(",", 1)[0],
    headers.get("x-real-ip"),
  ];
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/** The first six groups of the IPv6 forms that carry an IPv4 host in the last 32 bits. */
const IPV4_CARRYING_PREFIXES = [
  [0, 0, 0, 0, 0, 0xffff], // IPv4-mapped (`::ffff:0:0/96`), Node's socket form
  [0x64, 0xff9b, 0, 0, 0, 0], // NAT64 well-known prefix (`64:ff9b::/96`)
] as const;

/**
 * The eight 16-bit groups of an IPv6 address, a zone id (`%eth0`) dropped;
 * `null` for anything that is not IPv6.
 */
export function ipv6Groups(value: string): number[] | null {
  const address = value.split("%", 1)[0] ?? "";
  if (!isIPv6(address)) return null;

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

/**
 * The IPv4 host an IPv6 address carries (IPv4-mapped or NAT64), as
 * `a.b.c.d`; `null` when the groups carry none.
 */
export function carriedIPv4(groups: readonly number[]): string | null {
  const carriesIPv4 = IPV4_CARRYING_PREFIXES.some((prefix) =>
    prefix.every((group, index) => groups[index] === group),
  );
  if (!carriesIPv4) return null;
  const [high = 0, low = 0] = groups.slice(6);
  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
}

/**
 * One textual form per address, so the same visitor always reads the same:
 * IPv4 as is, an IPv6 address that carries an IPv4 host as that host, any
 * other IPv6 address compressed and lower-case (RFC 5952), without a zone id.
 * `null` for anything that is not an IP address.
 */
export function canonicalAddress(value: string | undefined): string | null {
  if (value === undefined) return null;
  if (isIPv4(value)) return value;
  const groups = ipv6Groups(value);
  if (!groups) return null;
  const ipv4 = carriedIPv4(groups);
  if (ipv4) return ipv4;
  // The WHATWG URL serializer writes an IPv6 host in the RFC 5952 form.
  const address = value.split("%", 1)[0] ?? "";
  return new URL(`http://[${address}]/`).hostname.slice(1, -1);
}
