import { createRequire } from "node:module";

import { expect, test } from "vitest";

import { config } from "@/proxy";
import { isPageView } from "./page-view";

// Next.js's own matcher compilation, so the test reads `config.matcher` the way
// the server does (path pattern plus its `missing` header conditions).
const require = createRequire(import.meta.url);
const { getMiddlewareMatchers } =
  require("next/dist/build/analysis/get-page-static-info.js") as {
    getMiddlewareMatchers: (matcher: unknown, nextConfig: object) => unknown[];
  };
const { getMiddlewareRouteMatcher } =
  require("next/dist/shared/lib/router/utils/middleware-route-matcher.js") as {
    getMiddlewareRouteMatcher: (
      matchers: unknown[],
    ) => (
      pathname: string,
      request: { headers: Record<string, string> },
      query: object,
    ) => boolean;
  };

const matches = getMiddlewareRouteMatcher(
  getMiddlewareMatchers(config.matcher, {}),
);

/** Whether the proxy runs for a request, as Next.js decides it. */
const proxyRuns = (pathname: string, headers: Record<string, string> = {}) =>
  matches(pathname, { headers }, {});

const view = (
  pathname: string,
  headers: Record<string, string> = {},
  method = "GET",
) => isPageView({ method, pathname, headers: new Headers(headers) });

const PAGES = ["/", "/preise", "/zahlung", "/ueber-mich", "/nicht-da"];

const NON_PAGES = [
  "/_next/static/chunks/main.js",
  "/_next/image",
  "/api/booking/availability",
  "/health",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
  "/opengraph-image",
  "/opengraph-image-1a2b3c",
  "/images/profile.webp",
  "/preise.rsc",
];

test("a document load or a client navigation of a page is a page view", () => {
  for (const pathname of PAGES) {
    expect(proxyRuns(pathname), pathname).toBe(true);
    expect(view(pathname), pathname).toBe(true);
    // The navigation's RSC request, as far as the proxy sees it.
    expect(view(pathname, { accept: "*/*", "sec-fetch-dest": "empty" })).toBe(
      true,
    );
  }
});

test("assets, internals, the API and metadata routes are never page views", () => {
  for (const pathname of NON_PAGES) {
    expect(proxyRuns(pathname), pathname).toBe(false);
    expect(view(pathname), pathname).toBe(false);
  }
});

test("a router prefetch never reaches the proxy, a browser prefetch never counts", () => {
  // Next.js strips its router headers before the proxy runs: only the matcher sees them.
  expect(proxyRuns("/preise", { "next-router-prefetch": "1" })).toBe(false);
  expect(
    proxyRuns("/preise", {
      "next-router-prefetch": "1",
      "next-router-segment-prefetch": "/_tree",
    }),
  ).toBe(false);
  expect(proxyRuns("/preise", { "sec-purpose": "prefetch;prerender" })).toBe(
    false,
  );
  expect(proxyRuns("/preise", { purpose: "prefetch" })).toBe(false);

  expect(view("/preise", { "next-router-prefetch": "1" })).toBe(false);
  expect(view("/preise", { "sec-purpose": "prefetch" })).toBe(false);
  expect(view("/preise", { "sec-purpose": "prefetch;prerender" })).toBe(false);
  expect(view("/preise", { purpose: "prefetch" })).toBe(false);
});

test("only a GET is a page view: a server action's POST or a HEAD is not", () => {
  expect(view("/termin", {}, "POST")).toBe(false);
  expect(view("/", {}, "HEAD")).toBe(false);
});
