import "server-only";

import {
  canonicalAddress,
  clientAddressFromHeaders,
} from "@/lib/client-address";
import { isProduction } from "@/lib/env";
import { pageTitle } from "./page-titles";

// Umami - cookieless web analytics, self-hosted at insights.leonweimann.de.
// The server reports to it; no analytics code runs in the visitor's browser.
// Neither the website id nor the host is a secret, so both are constants.

/** Umami's collect endpoint (Umami 3: no auth, `{ type: "event", payload }`). */
export const UMAMI_ENDPOINT = "https://insights.leonweimann.de/api/send";

export const UMAMI_WEBSITE_ID = "9214eb4f-0b92-48df-9514-a190e8fdb62b";

// Only this host reports. The pre-release lernen.leonweimann.de domain stays
// untracked; nachhilfe.leonweimann.de counts without a code change.
export const REPORTED_HOST = "nachhilfe.leonweimann.de";

/** Longest User-Agent passed on: it comes from a request header. */
const MAX_USER_AGENT_LENGTH = 512;

/** Longest page path or referrer passed on. */
const MAX_URL_LENGTH = 256;

/** Longest language tag passed on (BCP 47 tags in practice stay far below). */
const MAX_LANGUAGE_LENGTH = 35;

/**
 * What one report to Umami carries. `name` set makes it a custom event, absent
 * a page view. `ip` and `userAgent` override the headers of the server's own
 * request, so Umami derives the visitor hash, country and bot check from the
 * visitor, not from this server.
 */
export type UmamiPayload = {
  website: string;
  hostname: string;
  url: string;
  title?: string;
  referrer?: string;
  language?: string;
  name?: string;
  data?: Record<string, string | number>;
  ip: string;
  userAgent: string;
};

/** The visitor a report describes. */
type Visitor = Pick<UmamiPayload, "ip" | "userAgent" | "language">;

/** The request's host name, lower-case and without a port. */
function requestHost(headers: Headers): string | undefined {
  return headers.get("host")?.split(":", 1)[0]?.trim().toLowerCase();
}

/** The first language tag of `Accept-Language` (`de-DE,de;q=0.9` -> `de-DE`). */
export function primaryLanguage(header: string | null): string | undefined {
  const tag = header?.split(",", 1)[0]?.split(";", 1)[0]?.trim();
  return tag &&
    tag.length <= MAX_LANGUAGE_LENGTH &&
    /^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*$/.test(tag)
    ? tag
    : undefined;
}

/**
 * A referring page on another site, as origin and path: no query, no hash.
 * `undefined` for a page of this site, a malformed value or a non-web scheme.
 */
export function externalReferrer(
  header: string | null,
  ownHost: string,
): string | undefined {
  if (!header || !URL.canParse(header)) return undefined;
  const referrer = new URL(header);
  if (referrer.protocol !== "https:" && referrer.protocol !== "http:")
    return undefined;
  if (referrer.hostname.toLowerCase() === ownHost) return undefined;
  return `${referrer.origin}${referrer.pathname}`.slice(0, MAX_URL_LENGTH);
}

/** A path of this site from a same-site `Referer`, without query and hash. */
function sameSitePath(header: string | null, ownHost: string) {
  if (!header || !URL.canParse(header)) return undefined;
  const referrer = new URL(header);
  return referrer.hostname.toLowerCase() === ownHost
    ? referrer.pathname
    : undefined;
}

/**
 * The visitor of a request, or `null` when it must not be reported: outside a
 * production build, on any host but `REPORTED_HOST`, or without a valid IP
 * address or a User-Agent - Umami would merge such a report into one visitor,
 * this server.
 */
function reportedVisitor(headers: Headers): Visitor | null {
  if (!isProduction() || requestHost(headers) !== REPORTED_HOST) return null;
  const ip = canonicalAddress(clientAddressFromHeaders(headers));
  const userAgent = headers
    .get("user-agent")
    ?.trim()
    .slice(0, MAX_USER_AGENT_LENGTH);
  if (!ip || !userAgent) return null;
  const language = primaryLanguage(headers.get("accept-language"));
  return { ip, userAgent, ...(language && { language }) };
}

/**
 * The page view of a page request: the path only (no query, no hash - the
 * payment link's query is an invoice), its title when the page is known, and a
 * referrer only when it is another site. `null` when the request is not reported.
 */
export function pageViewPayload(
  headers: Headers,
  pathname: string,
): UmamiPayload | null {
  const visitor = reportedVisitor(headers);
  if (!visitor) return null;
  const url = pathname.split(/[?#]/, 1)[0]?.slice(0, MAX_URL_LENGTH) || "/";
  const title = pageTitle(url);
  const referrer = externalReferrer(headers.get("referer"), REPORTED_HOST);
  return {
    website: UMAMI_WEBSITE_ID,
    hostname: REPORTED_HOST,
    url,
    ...(title && { title }),
    ...(referrer && { referrer }),
    ...visitor,
  };
}

export type AnalyticsEvent = {
  name: string;
  data: Record<string, string | number>;
  /** The page the event belongs to when the request names none (no same-site `Referer`). */
  fallbackUrl: string;
};

/**
 * A custom event, reported from a server action: it belongs to the page the
 * request came from (its `Referer`, path only), else to `fallbackUrl`.
 * `null` when the request is not reported.
 */
export function eventPayload(
  headers: Headers,
  event: AnalyticsEvent,
): UmamiPayload | null {
  const visitor = reportedVisitor(headers);
  if (!visitor) return null;
  const url = (
    sameSitePath(headers.get("referer"), REPORTED_HOST) ?? event.fallbackUrl
  ).slice(0, MAX_URL_LENGTH);
  return {
    website: UMAMI_WEBSITE_ID,
    hostname: REPORTED_HOST,
    url,
    name: event.name,
    data: event.data,
    ...visitor,
  };
}
