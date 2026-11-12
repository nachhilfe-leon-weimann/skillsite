import { expect, test } from "vitest";

import { createSkillforgeAuthApi } from "./skillforge";

const connection = {
  baseUrl: "http://skillforge.test",
  clientId: "portal-test",
  clientSecret: "sf_live_synthetic",
};

function capture(response: () => Response | Promise<Response>) {
  const requests: Request[] = [];
  const fetch: typeof globalThis.fetch = async (input, init) => {
    requests.push(new Request(input, init));
    return response();
  };
  return { requests, api: createSkillforgeAuthApi(connection, fetch) };
}

const tokenResponse = () =>
  Response.json({
    access_token: "sf_at_synthetic",
    token_type: "bearer",
    expires_in: 900,
    scope: "account:self",
    refresh_token: "sf_rt_synthetic",
    refresh_expires_in: 3600,
  });

test("the password grant is form-encoded and authenticates the client with HTTP Basic", async () => {
  const { requests, api } = capture(tokenResponse);

  const result = await api.passwordGrant("admin@example.com", "pä ss&word=");

  const request = requests[0]!;
  expect(request.url).toBe("http://skillforge.test/api/v1/auth/token");
  expect(request.method).toBe("POST");
  expect(request.headers.get("content-type")).toBe(
    "application/x-www-form-urlencoded",
  );
  expect(request.headers.get("authorization")).toBe(
    `Basic ${btoa("portal-test:sf_live_synthetic")}`,
  );
  expect(request.cache).toBe("no-store");
  expect(Object.fromEntries(new URLSearchParams(await request.text()))).toEqual(
    {
      grant_type: "password",
      username: "admin@example.com",
      password: "pä ss&word=",
    },
  );
  expect(result).toEqual({
    ok: true,
    tokens: {
      accessToken: "sf_at_synthetic",
      expiresIn: 900,
      refreshToken: "sf_rt_synthetic",
      refreshExpiresIn: 3600,
    },
  });
});

test("invalid_grant is told apart from every other refusal", async () => {
  const invalid = capture(() =>
    Response.json({ code: "invalid_grant", detail: "x" }, { status: 400 }),
  );
  expect(await invalid.api.refreshGrant("sf_rt_synthetic")).toEqual({
    ok: false,
    error: "invalid_grant",
  });

  const client = capture(() =>
    Response.json({ code: "invalid_client", detail: "x" }, { status: 401 }),
  );
  expect(await client.api.clientCredentials()).toEqual({
    ok: false,
    error: "rejected",
    status: 401,
    code: "invalid_client",
  });
});

test("an error body's free text never becomes a code", async () => {
  const { api } = capture(() =>
    Response.json(
      { code: "Invalid credentials for admin@example.com" },
      {
        status: 400,
      },
    ),
  );
  expect(await api.clientCredentials()).toEqual({
    ok: false,
    error: "rejected",
    status: 400,
    code: undefined,
  });
});

test.each([
  ["a network error", () => Promise.reject(new TypeError("fetch failed"))],
  ["a 5xx", () => new Response("bad gateway", { status: 502 })],
])("%s is unreachable", async (_, response) => {
  const { api } = capture(response as () => Promise<Response>);
  expect(await api.me("sf_at_synthetic")).toEqual({
    ok: false,
    error: "unreachable",
  });
});

test("revoke sends the refresh token with the portal's own bearer token", async () => {
  const { requests, api } = capture(() => new Response(null, { status: 204 }));

  expect(await api.revoke("sf_rt_synthetic", "sf_at_service")).toEqual({
    ok: true,
  });
  const request = requests[0]!;
  expect(request.url).toBe("http://skillforge.test/api/v1/auth/revoke");
  expect(request.headers.get("authorization")).toBe("Bearer sf_at_service");
  expect(await request.json()).toEqual({ refresh_token: "sf_rt_synthetic" });
});

test("every call refuses to follow a redirect", async () => {
  const { requests, api } = capture(tokenResponse);
  await api.clientCredentials();
  await api.me("sf_at_synthetic");
  await api.revoke("sf_rt_synthetic", "sf_at_service");
  expect(requests.map((request) => request.redirect)).toEqual([
    "error",
    "error",
    "error",
  ]);
});

test("a token response that breaks the contract is invalid, not a token", async () => {
  const { api } = capture(() =>
    Response.json({ access_token: "sf_at_synthetic", expires_in: "900" }),
  );
  expect(await api.clientCredentials()).toEqual({
    ok: false,
    error: "invalid_response",
  });
});

test("an /auth/me answer without roles is invalid", async () => {
  const { api } = capture(() =>
    Response.json({ principal_type: "user", user_id: "u", party_id: null }),
  );
  expect(await api.me("sf_at_synthetic")).toEqual({
    ok: false,
    error: "invalid_response",
  });
});
