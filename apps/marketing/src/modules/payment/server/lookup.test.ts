import assert from "node:assert/strict";
import {
  createSkillforgeClient,
  type ServiceTokenSource,
} from "@skillsite/api-client";
import { afterEach, type Mock, test, vi } from "vitest";

import type { ServerEnv } from "@/lib/env";

const env = vi.hoisted(() => ({
  serverEnv: vi.fn((): ServerEnv => ({})),
}));
vi.mock("@/lib/env", () => env);

import { createLookup } from "./lookup";

// Synthetic data only; no request ever leaves the test.
const ORIGIN = "http://skillforge.test";
const INVOICE = "RE-1001";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** A token source that hands out the given tokens in turn; `null` is one SkillForge did not issue. */
function fakeTokens(
  ...issued: (string | null)[]
): ServiceTokenSource & { invalidate: Mock<() => void> } {
  const queue = issued.length > 0 ? issued : ["synthetic-token"];
  let next = 0;
  return {
    token: vi.fn(async () => queue[Math.min(next++, queue.length - 1)]!),
    invalidate: vi.fn<() => void>(),
  };
}

type Respond = (request: Request) => Response | Promise<Response>;

/** A lookup over a recording fetch stub. */
function setup(respond: Respond, tokens = fakeTokens(), timeoutMs?: number) {
  const requests: Request[] = [];
  const client = createSkillforgeClient({
    baseUrl: ORIGIN,
    fetch: async (request) => {
      requests.push(request);
      return respond(request);
    },
  });
  return {
    lookup: createLookup({ client, tokens, timeoutMs }),
    requests,
    tokens,
  };
}

/** SkillForge's `200` for the asked number, an open invoice PayPal may pay unless overridden. */
const answer = (body: Record<string, unknown> = {}) =>
  Response.json({
    invoice_number: INVOICE,
    state: "open",
    open_amount_cents: 9000,
    paypal: "allowed",
    ...body,
  });

const status = (code: number) =>
  Response.json({ code: "synthetic", message: "synthetic" }, { status: code });

/** A SkillForge that never answers: the request only ends when it is aborted. */
const hangUntilAborted: Respond = (request) =>
  new Promise((_resolve, reject) => {
    request.signal.addEventListener("abort", () =>
      reject(new DOMException("The operation was aborted.", "AbortError")),
    );
  });

test("an open invoice answers its open amount and PayPal flag", async () => {
  const { lookup, requests } = setup(() => answer());

  assert.deepEqual(await lookup(INVOICE), {
    kind: "open",
    amountCents: 9000,
    paypal: "allowed",
  });
  assert.equal(requests.length, 1);
  const [request] = requests;
  assert.equal(request!.method, "GET");
  assert.equal(
    request!.url,
    `${ORIGIN}/api/v1/billing/payment-requests/${INVOICE}`,
  );
  assert.equal(request!.headers.get("Authorization"), "Bearer synthetic-token");
  assert.equal(request!.cache, "no-store");
  assert.equal(request!.redirect, "error");
});

test("an invoice paid only by transfer keeps its blocked flag", async () => {
  const { lookup } = setup(() => answer({ paypal: "blocked" }));

  assert.deepEqual(await lookup(INVOICE), {
    kind: "open",
    amountCents: 9000,
    paypal: "blocked",
  });
});

test("a paid invoice answers paid", async () => {
  const { lookup } = setup(() =>
    answer({ state: "paid", open_amount_cents: 0 }),
  );

  assert.deepEqual(await lookup(INVOICE), { kind: "paid" });
});

test("a 404 answers not payable", async () => {
  const { lookup } = setup(() => status(404));

  assert.deepEqual(await lookup(INVOICE), { kind: "not_payable" });
});

test("a 401 invalidates the token and retries once with a fresh one", async () => {
  let calls = 0;
  const tokens = fakeTokens("synthetic-token-1", "synthetic-token-2");
  const { lookup, requests } = setup(
    () => (calls++ === 0 ? status(401) : answer()),
    tokens,
  );

  assert.deepEqual(await lookup(INVOICE), {
    kind: "open",
    amountCents: 9000,
    paypal: "allowed",
  });
  assert.equal(tokens.invalidate.mock.calls.length, 1);
  assert.deepEqual(
    requests.map((request) => request.headers.get("Authorization")),
    ["Bearer synthetic-token-1", "Bearer synthetic-token-2"],
  );
});

test("a second 401 ends unavailable without a third request", async () => {
  const { lookup, requests, tokens } = setup(() => status(401));

  assert.deepEqual(await lookup(INVOICE), { kind: "unavailable" });
  assert.equal(requests.length, 2);
  assert.equal(tokens.invalidate.mock.calls.length, 1);
});

test("a 401 whose fresh token is not issued ends unavailable", async () => {
  const { lookup, requests } = setup(
    () => status(401),
    fakeTokens("synthetic-token", null),
  );

  assert.deepEqual(await lookup(INVOICE), { kind: "unavailable" });
  assert.equal(requests.length, 1);
});

test("without a token the lookup ends unavailable without a request", async () => {
  const { lookup, requests } = setup(() => answer(), fakeTokens(null));

  assert.deepEqual(await lookup(INVOICE), { kind: "unavailable" });
  assert.equal(requests.length, 0);
});

test("a 429 ends unavailable", async () => {
  const { lookup } = setup(() => status(429));

  assert.deepEqual(await lookup(INVOICE), { kind: "unavailable" });
});

test("a 5xx ends unavailable", async () => {
  for (const code of [500, 502, 503, 504]) {
    const { lookup } = setup(() => status(code));
    assert.deepEqual(await lookup(INVOICE), { kind: "unavailable" }, `${code}`);
  }
});

test("any other answer ends unavailable", async () => {
  for (const code of [201, 204, 302, 400, 403, 422]) {
    const { lookup } = setup(() =>
      code === 204 ? new Response(null, { status: 204 }) : status(code),
    );
    assert.deepEqual(await lookup(INVOICE), { kind: "unavailable" }, `${code}`);
  }
});

test("a body off the contract ends unavailable", async () => {
  const bodies: (() => Response)[] = [
    () => answer({ state: "draft" }),
    () => answer({ state: undefined }),
    () => answer({ open_amount_cents: -1 }),
    () => answer({ open_amount_cents: 90.5 }),
    () => answer({ open_amount_cents: "9000" }),
    () => answer({ open_amount_cents: 2 ** 60 }),
    () => answer({ paypal: "maybe" }),
    () => answer({ paypal: undefined }),
    () => answer({ invoice_number: undefined }),
    () => Response.json(null),
    () => Response.json([]),
    () => new Response("not json", { status: 200 }),
  ];
  for (const [index, body] of bodies.entries()) {
    const { lookup } = setup(body);
    assert.deepEqual(
      await lookup(INVOICE),
      { kind: "unavailable" },
      `body ${index}`,
    );
  }
});

test("a 200 for another number ends unavailable", async () => {
  const { lookup } = setup(() => answer({ invoice_number: "RE-1002" }));

  assert.deepEqual(await lookup(INVOICE), { kind: "unavailable" });
});

test("a thrown fetch ends unavailable", async () => {
  const { lookup } = setup(() => {
    throw new TypeError("fetch failed");
  });

  assert.deepEqual(await lookup(INVOICE), { kind: "unavailable" });
});

test("a fetch that never resolves ends unavailable after the timeout", async () => {
  vi.useFakeTimers();
  const { lookup } = setup(hangUntilAborted, fakeTokens(), 50);

  let settled = false;
  const result = lookup(INVOICE).finally(() => {
    settled = true;
  });
  await vi.advanceTimersByTimeAsync(49);
  assert.equal(settled, false, "gave up before the timeout");
  await vi.advanceTimersByTimeAsync(1);

  assert.deepEqual(await result, { kind: "unavailable" });
});

test("a body that outlasts the timeout ends unavailable", async () => {
  vi.useFakeTimers();
  const { lookup } = setup(
    (request) =>
      new Response(
        new ReadableStream({
          start(stream) {
            request.signal.addEventListener("abort", () =>
              stream.error(new DOMException("aborted", "AbortError")),
            );
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    fakeTokens(),
    50,
  );

  const result = lookup(INVOICE);
  await vi.advanceTimersByTimeAsync(50);

  assert.deepEqual(await result, { kind: "unavailable" });
});

test("an unconfigured runtime answers unavailable without a request", async () => {
  vi.resetModules();
  const fetchStub = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchStub);
  env.serverEnv.mockReturnValue({});
  const { lookupInvoice } = await import("./lookup");

  assert.deepEqual(await lookupInvoice(INVOICE), { kind: "unavailable" });
  assert.equal(fetchStub.mock.calls.length, 0);
});

test("a configured runtime asks SkillForge with its own client's token, fetched once", async () => {
  vi.resetModules();
  const requests: Request[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      requests.push(request);
      return request.url.endsWith("/api/v1/auth/token")
        ? Response.json({
            access_token: "synthetic-token",
            token_type: "bearer",
            expires_in: 3600,
          })
        : answer();
    }),
  );
  env.serverEnv.mockReturnValue({
    SKILLFORGE_API_URL: `${ORIGIN}/`,
    SKILLFORGE_CLIENT_ID: "marketing-e2e",
    SKILLFORGE_CLIENT_SECRET: "sf_synthetic_secret",
  });
  const { lookupInvoice } = await import("./lookup");

  const expected = { kind: "open", amountCents: 9000, paypal: "allowed" };
  assert.deepEqual(await lookupInvoice(INVOICE), expected);
  assert.deepEqual(await lookupInvoice(INVOICE), expected);

  assert.deepEqual(
    requests.map((request) => `${request.method} ${request.url}`),
    [
      `POST ${ORIGIN}/api/v1/auth/token`,
      `GET ${ORIGIN}/api/v1/billing/payment-requests/${INVOICE}`,
      `GET ${ORIGIN}/api/v1/billing/payment-requests/${INVOICE}`,
    ],
  );
  const basic = Buffer.from("marketing-e2e:sf_synthetic_secret").toString(
    "base64",
  );
  assert.equal(requests[0]!.headers.get("Authorization"), `Basic ${basic}`);
  assert.equal(
    requests[1]!.headers.get("Authorization"),
    "Bearer synthetic-token",
  );
});
