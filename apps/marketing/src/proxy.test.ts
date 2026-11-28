import { NextRequest, type NextFetchEvent } from "next/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { proxy } from "./proxy";

const umami = vi.fn(async () => new Response("{}", { status: 200 }));

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubGlobal("fetch", umami);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  umami.mockClear();
});

/** Run the proxy for one request of a visitor on the live host; the reports it schedules. */
function run(path: string, method = "GET") {
  const waitUntil = vi.fn();
  const request = new NextRequest(`https://nachhilfe.leonweimann.de${path}`, {
    method,
    headers: {
      host: "nachhilfe.leonweimann.de",
      // Documentation range (RFC 5737) and a synthetic browser string.
      "cf-connecting-ip": "203.0.113.4",
      "user-agent": "Mozilla/5.0 TestBrowser/1.0",
    },
  });
  const result = proxy(request, { waitUntil } as unknown as NextFetchEvent);
  return { result, waitUntil };
}

test("a page view is reported after the response, and the request goes on unchanged", async () => {
  const { result, waitUntil } = run("/preise?x=1");
  expect(result).toBeUndefined();
  expect(waitUntil).toHaveBeenCalledOnce();
  await waitUntil.mock.calls[0]?.[0];
  const [, init] = umami.mock.calls[0] as unknown as [string, RequestInit];
  expect(JSON.parse(String(init.body)).payload.url).toBe("/preise");
});

test("a POST, a HEAD or a file is never reported", () => {
  for (const [path, method] of [
    ["/termin", "POST"],
    ["/", "HEAD"],
    ["/preise.rsc", "GET"],
    ["/robots.txt", "GET"],
  ] as const) {
    const { result, waitUntil } = run(path, method);
    expect(result).toBeUndefined();
    expect(waitUntil, `${method} ${path}`).not.toHaveBeenCalled();
  }
});
