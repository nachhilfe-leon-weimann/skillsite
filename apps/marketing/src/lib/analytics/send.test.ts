import {
  afterEach,
  beforeEach,
  expect,
  test,
  vi,
  type MockInstance,
} from "vitest";

import { sendToUmami } from "./send";
import { UMAMI_ENDPOINT, type UmamiPayload } from "./umami";

const payload: UmamiPayload = {
  website: "website-id",
  hostname: "nachhilfe.leonweimann.de",
  url: "/preise",
  ip: "203.0.113.4",
  userAgent: "Mozilla/5.0 TestBrowser/1.0",
};

let warn: MockInstance<typeof console.warn>;

beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The log lines written, checked to hold no visitor detail. */
function loggedLines(): string[] {
  const lines = warn.mock.calls.map((call) => call.join(" "));
  for (const line of lines) {
    expect(line).not.toContain(payload.ip);
    expect(line).not.toContain(payload.userAgent);
  }
  return lines;
}

test("a report is one event POST to Umami, with a timeout", async () => {
  const fetch = vi.fn(async () => new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetch);

  await sendToUmami(payload);

  expect(fetch).toHaveBeenCalledOnce();
  const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe(UMAMI_ENDPOINT);
  expect(init.method).toBe("POST");
  expect(init.signal).toBeInstanceOf(AbortSignal);
  expect(JSON.parse(String(init.body))).toEqual({ type: "event", payload });
  expect(loggedLines()).toEqual([]);
});

test("an unreachable Umami costs the report, never the request, and leaves one line", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("fetch failed");
    }),
  );

  await expect(sendToUmami(payload)).resolves.toBeUndefined();
  expect(loggedLines()).toEqual(['[analytics] failed {"cause":"network"}']);
});

test("a report that takes too long is dropped with one line", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    }),
  );

  await expect(sendToUmami(payload)).resolves.toBeUndefined();
  expect(loggedLines()).toEqual(['[analytics] failed {"cause":"timeout"}']);
});

test("a report Umami turns down leaves one line with its status", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("bad", { status: 400 })),
  );

  await expect(sendToUmami(payload)).resolves.toBeUndefined();
  expect(loggedLines()).toEqual(['[analytics] failed {"status":400}']);
});
