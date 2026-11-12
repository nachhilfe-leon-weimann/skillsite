import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";
import { test } from "vitest";

import { config, proxy } from "./proxy";
import { sessionCookieName } from "@/modules/auth";

const origin = "http://portal.test";
// The tests run outside a production build: the cookie goes without its `__Host-` prefix.
const cookie = sessionCookieName(false);

function request(path: string, cookies: Record<string, string> = {}) {
  const headers = new Headers();
  const pairs = Object.entries(cookies).map(
    ([name, value]) => `${name}=${value}`,
  );
  if (pairs.length > 0) headers.set("cookie", pairs.join("; "));
  return new NextRequest(new URL(path, origin), { headers });
}

test.each(["/", "/stunden", "/gibt-es-nicht"])(
  "%s without a session cookie redirects to /login",
  (path) => {
    assert.equal(getRedirectUrl(proxy(request(path))), `${origin}/login`);
  },
);

test.each(["/", "/stunden"])("%s with a session cookie passes", (path) => {
  assert.equal(getRedirectUrl(proxy(request(path, { [cookie]: "x" }))), null);
});

test("a cookie of another name does not count as a session", () => {
  assert.equal(
    getRedirectUrl(proxy(request("/", { other: "x" }))),
    `${origin}/login`,
  );
});

test.each(["/login", "/health"])("%s stays open without a session", (path) => {
  assert.equal(getRedirectUrl(proxy(request(path))), null);
});

test.each([
  ["/", true],
  ["/login", true],
  ["/stunden/2026-11", true],
  ["/_next/static/chunks/app.js", false],
  ["/_next/image", false],
  ["/favicon.ico", false],
  ["/logo-icon.png", false],
])("the proxy runs on %s: %s", (path, expected) => {
  assert.equal(
    unstable_doesMiddlewareMatch({ config, url: `${origin}${path}` }),
    expected,
  );
});
