/**
 * Which requests are a page view. `proxy.ts` sees every request its matcher
 * lets through; this check decides on its own as well, so a looser matcher
 * never counts an asset or a prefetch.
 *
 * Counted: a document load and a client-side navigation (the RSC request of
 * the page). Never counted: prefetches (Next.js's router, the browser's
 * speculative loads), non-GET requests (server actions are POSTs), Next.js
 * internals, the API, the health check, metadata routes and any file.
 *
 * In the proxy, Next.js strips its router headers (`rsc`,
 * `next-router-prefetch`, ...) from the request, so a router prefetch is kept
 * out by the matcher's `missing` condition; the header checks here hold where
 * those headers are visible.
 */

/** Metadata routes served without a file extension. */
const METADATA_ROUTES = [
  "opengraph-image",
  "twitter-image",
  "icon",
  "apple-icon",
];

/** Path prefixes that are never a page. */
const NON_PAGE_PREFIXES = ["/_next/", "/api/"];

/** Exact paths that are never a page. */
const NON_PAGE_PATHS = ["/health"];

export type PageRequest = {
  method: string;
  pathname: string;
  headers: Headers;
};

/** Whether a header marks the request as a prefetch or speculative load. */
function isPrefetch(headers: Headers): boolean {
  if (headers.has("next-router-prefetch")) return true;
  if (headers.has("next-router-segment-prefetch")) return true;
  // `Sec-Purpose: prefetch` (and `prefetch;prerender`), legacy `Purpose: prefetch`.
  return ["sec-purpose", "purpose"].some((name) =>
    headers.get(name)?.toLowerCase().includes("prefetch"),
  );
}

/** Whether a path can be a page: no internal route, no metadata route, no file. */
export function isPagePath(pathname: string): boolean {
  if (NON_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix)))
    return false;
  if (NON_PAGE_PATHS.includes(pathname)) return false;
  const lastSegment = pathname.slice(pathname.lastIndexOf("/") + 1);
  if (lastSegment.includes(".")) return false;
  return !METADATA_ROUTES.some(
    (route) => lastSegment === route || lastSegment.startsWith(`${route}-`),
  );
}

/** Whether a request is a page view: a GET for a page path that is no prefetch. */
export function isPageView({
  method,
  pathname,
  headers,
}: PageRequest): boolean {
  return method === "GET" && isPagePath(pathname) && !isPrefetch(headers);
}
