import { afterEach, beforeEach, expect, test, vi } from "vitest";

import {
  eventPayload,
  externalReferrer,
  pageViewPayload,
  primaryLanguage,
  REPORTED_HOST,
  UMAMI_WEBSITE_ID,
} from "./umami";

// Documentation range (RFC 5737): no real address. A synthetic browser string.
const VISITOR_IP = "203.0.113.4";
const VISITOR_UA = "Mozilla/5.0 (X11; Linux x86_64) TestBrowser/1.0";

/** A request through Cloudflare to the live host. */
const visit = (extra: Record<string, string> = {}) =>
  new Headers({
    host: REPORTED_HOST,
    "cf-connecting-ip": VISITOR_IP,
    "user-agent": VISITOR_UA,
    ...extra,
  });

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("a page view names the page, its title and the visitor Umami needs, nothing else", () => {
  expect(
    pageViewPayload(
      visit({ "accept-language": "de-DE,de;q=0.9,en;q=0.8" }),
      "/preise",
    ),
  ).toEqual({
    website: UMAMI_WEBSITE_ID,
    hostname: REPORTED_HOST,
    url: "/preise",
    title: "Preise – Nachhilfe Leon Weimann",
    language: "de-DE",
    ip: VISITOR_IP,
    userAgent: VISITOR_UA,
  });
});

test("the payment link's query never reaches analytics", () => {
  const payload = pageViewPayload(
    visit(),
    "/zahlung?re=RE-0000&betrag=90,00%20EUR#top",
  );
  expect(payload?.url).toBe("/zahlung");
  expect(JSON.stringify(payload)).not.toMatch(/RE-0000|betrag|#top/);
});

test("an unknown path is counted without a title", () => {
  const payload = pageViewPayload(visit(), "/nicht-da");
  expect(payload?.url).toBe("/nicht-da");
  expect(payload).not.toHaveProperty("title");
});

test("only another site is a referrer, as origin and path", () => {
  expect(
    pageViewPayload(
      visit({ referer: "https://www.example.com/suche?q=nachhilfe#x" }),
      "/",
    )?.referrer,
  ).toBe("https://www.example.com/suche");
  // A client navigation within the site.
  expect(
    pageViewPayload(
      visit({ referer: `https://${REPORTED_HOST}/preise?x=1` }),
      "/ablauf",
    ),
  ).not.toHaveProperty("referrer");
  expect(externalReferrer("android-app://com.example/", REPORTED_HOST)).toBe(
    undefined,
  );
  expect(externalReferrer("not a url", REPORTED_HOST)).toBe(undefined);
});

test("the language is the first tag of Accept-Language, or none", () => {
  expect(primaryLanguage("en-US,en;q=0.5")).toBe("en-US");
  expect(primaryLanguage("de;q=0.9")).toBe("de");
  expect(primaryLanguage("*")).toBe(undefined);
  expect(primaryLanguage("")).toBe(undefined);
  expect(primaryLanguage(null)).toBe(undefined);
});

test("no screen size or other browser detail is sent", () => {
  const payload = pageViewPayload(visit(), "/");
  expect(Object.keys(payload ?? {}).sort()).toEqual(
    ["hostname", "ip", "title", "url", "userAgent", "website"].sort(),
  );
});

test("without the visitor's IP address or User-Agent nothing is sent", () => {
  const withoutIp = new Headers({
    host: REPORTED_HOST,
    "user-agent": VISITOR_UA,
  });
  const withoutUa = new Headers({
    host: REPORTED_HOST,
    "cf-connecting-ip": VISITOR_IP,
  });
  const event = { name: "slot-selected", data: {}, fallbackUrl: "/termin" };
  for (const headers of [
    withoutIp,
    withoutUa,
    visit({ "user-agent": "  " }),
    visit({ "cf-connecting-ip": "not-an-address" }),
  ]) {
    expect(pageViewPayload(headers, "/")).toBe(null);
    expect(eventPayload(headers, event)).toBe(null);
  }
});

test("the visitor's address is sent in one form, whichever header names it", () => {
  const ipOf = (headers: Record<string, string>) =>
    pageViewPayload(
      new Headers({
        host: REPORTED_HOST,
        "user-agent": VISITOR_UA,
        ...headers,
      }),
      "/",
    )?.ip;
  expect(ipOf({ "x-forwarded-for": `::ffff:${VISITOR_IP}, 10.0.0.1` })).toBe(
    VISITOR_IP,
  );
  expect(ipOf({ "cf-connecting-ip": "2001:0DB8:0:0::0007" })).toBe(
    "2001:db8::7",
  );
});

test("only the live host of a production build reports", () => {
  expect(pageViewPayload(visit({ host: "lernen.leonweimann.de" }), "/")).toBe(
    null,
  );
  expect(pageViewPayload(visit({ host: "localhost:3000" }), "/")).toBe(null);
  expect(
    pageViewPayload(visit({ host: `${REPORTED_HOST}:443` }), "/"),
  ).not.toBe(null);

  vi.stubEnv("NODE_ENV", "development");
  expect(pageViewPayload(visit(), "/")).toBe(null);
  expect(
    eventPayload(visit(), {
      name: "slot-selected",
      data: {},
      fallbackUrl: "/",
    }),
  ).toBe(null);
});

test("an event belongs to the page it was sent from, else to its fallback page", () => {
  const event = {
    name: "booking-started",
    data: { type: "nachhilfe" },
    fallbackUrl: "/termin",
  };
  expect(
    eventPayload(
      visit({ referer: `https://${REPORTED_HOST}/kontakt?x=1#k` }),
      event,
    ),
  ).toEqual({
    website: UMAMI_WEBSITE_ID,
    hostname: REPORTED_HOST,
    url: "/kontakt",
    name: "booking-started",
    data: { type: "nachhilfe" },
    ip: VISITOR_IP,
    userAgent: VISITOR_UA,
  });
  expect(eventPayload(visit(), event)?.url).toBe("/termin");
  expect(
    eventPayload(visit({ referer: "https://www.example.com/" }), event)?.url,
  ).toBe("/termin");
});
