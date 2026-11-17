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
    if (trimmed) return trimmed.slice(0, MAX_CLIENT_ID_LENGTH);
  }
  return "unknown";
}
