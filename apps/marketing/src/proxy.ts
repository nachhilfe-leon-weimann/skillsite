import type { NextFetchEvent, NextRequest } from "next/server";

import { isPageView } from "@/lib/analytics/page-view";
import { sendToUmami } from "@/lib/analytics/send";
import { pageViewPayload } from "@/lib/analytics/umami";

/**
 * Reports each page view to Umami from the server, after the response is on
 * its way. The proxy never changes a request: it returns nothing, so Next.js
 * goes on as without it.
 */
export function proxy(request: NextRequest, event: NextFetchEvent) {
  const { method, headers, nextUrl } = request;
  if (!isPageView({ method, pathname: nextUrl.pathname, headers })) return;
  const payload = pageViewPayload(headers, nextUrl.pathname);
  if (payload) event.waitUntil(sendToUmami(payload));
}

export const config = {
  matcher: [
    {
      // Pages only: no Next.js internals, API, health check, metadata image or file.
      source:
        "/((?!_next/|api/|health$|opengraph-image|twitter-image|icon|apple-icon|.*\\.[^/]*$).*)",
      // Next.js strips its router headers before the proxy runs, so a router
      // prefetch can only be told apart here. A browser prefetch too.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        // A server action (the booking) is no page view; spares it the proxy.
        { type: "header", key: "next-action" },
        { type: "header", key: "next-router-segment-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
        { type: "header", key: "sec-purpose", value: "prefetch.*" },
      ],
    },
  ],
};
