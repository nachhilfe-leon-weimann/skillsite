import assert from "node:assert/strict";
import { afterEach, test, vi } from "vitest";

import { requestToken, sendMail } from "./graph-mail";

// Synthetic configuration: no real tenant, app, secret or mailbox.
const config = {
  tenantId: "00000000-0000-4000-8000-000000000001",
  clientId: "00000000-0000-4000-8000-000000000002",
  clientSecret: "synthetic-secret",
  mailbox: "widerruf@example.com",
};
const message = { subject: "Betreff", body: "Text" };

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(answer: (url: URL) => Response | Promise<Response>) {
  const fetch = vi.fn(async (url: URL, _init?: RequestInit) => answer(url));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

test("the token request uses client credentials for Graph's default scope", async () => {
  const fetch = stubFetch(() => Response.json({ access_token: "token-1" }));
  assert.deepEqual(await requestToken(config), { ok: true, token: "token-1" });

  const [url, init] = fetch.mock.calls[0]!;
  assert.equal(
    String(url),
    `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
  );
  assert.equal(init?.method, "POST");
  assert.equal(init?.redirect, "error");
  const form = new URLSearchParams(String(init?.body));
  assert.equal(form.get("grant_type"), "client_credentials");
  assert.equal(form.get("scope"), "https://graph.microsoft.com/.default");
  assert.equal(form.get("client_id"), config.clientId);
  assert.equal(form.get("client_secret"), config.clientSecret);
});

test("a token failure of any kind is a refusal: no mail was sent", async () => {
  stubFetch(() => new Response("{}", { status: 401 }));
  assert.deepEqual(await requestToken(config), {
    ok: false,
    failure: { step: "token", status: 401 },
  });

  stubFetch(() => new Response("not json", { status: 200 }));
  assert.deepEqual(await requestToken(config), {
    ok: false,
    failure: { step: "token", status: 200, cause: "unreadable" },
  });

  stubFetch(() => {
    throw new DOMException("timed out", "TimeoutError");
  });
  assert.deepEqual(await requestToken(config), {
    ok: false,
    failure: { step: "token", cause: "timeout" },
  });
});

test("sendMail posts plain text from the mailbox and keeps it in Sent Items", async () => {
  const fetch = stubFetch(() => new Response(null, { status: 202 }));
  assert.deepEqual(
    await sendMail(
      config,
      "token-1",
      "acknowledgement",
      "erika@example.com",
      message,
    ),
    { state: "sent" },
  );

  const [url, init] = fetch.mock.calls[0]!;
  assert.equal(
    String(url),
    "https://graph.microsoft.com/v1.0/users/widerruf%40example.com/sendMail",
  );
  assert.equal(
    (init?.headers as Record<string, string>).Authorization,
    "Bearer token-1",
  );
  assert.deepEqual(JSON.parse(String(init?.body)), {
    message: {
      subject: "Betreff",
      body: { contentType: "Text", content: "Text" },
      toRecipients: [{ emailAddress: { address: "erika@example.com" } }],
    },
    saveToSentItems: true,
  });
});

test("only Graph's 202 is a sent mail: 4xx is refused, the rest unknown", async () => {
  const cases: [Response | Error, string][] = [
    [new Response(null, { status: 400 }), "refused"],
    [new Response(null, { status: 403 }), "refused"],
    [new Response(null, { status: 429 }), "refused"],
    [new Response(null, { status: 200 }), "unknown"],
    [new Response(null, { status: 500 }), "unknown"],
    [new Response(null, { status: 503 }), "unknown"],
    [new DOMException("timed out", "TimeoutError"), "unknown"],
    [new TypeError("fetch failed"), "unknown"],
  ];
  for (const [answer, state] of cases) {
    stubFetch(() => {
      if (answer instanceof Error) throw answer;
      return answer;
    });
    const result = await sendMail(
      config,
      "t",
      "notice",
      "a@example.com",
      message,
    );
    assert.equal(result.state, state, String(answer));
  }
});

test("the tenant and the mailbox stay path segments: no value reaches another host", async () => {
  const fetch = stubFetch(() => new Response(null, { status: 202 }));
  await requestToken({ ...config, tenantId: "evil.example/x?y#" });
  await sendMail(
    { ...config, mailbox: "@evil.example/../x?y#" },
    "t",
    "notice",
    "a@example.com",
    message,
  );
  assert.deepEqual(
    fetch.mock.calls.map(([url]) => new URL(String(url)).hostname),
    ["login.microsoftonline.com", "graph.microsoft.com"],
  );
});
