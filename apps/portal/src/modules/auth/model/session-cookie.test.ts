import assert from "node:assert/strict";
import { test } from "vitest";

import { sessionCookieName } from "./session-cookie";

test("a production build names the cookie with the __Host- prefix", () => {
  assert.equal(sessionCookieName(true), "__Host-session");
});

test("next dev, without HTTPS, names it without the prefix", () => {
  // The browser drops a `__Host-` cookie that is not `Secure`, and `Secure` needs HTTPS.
  assert.equal(sessionCookieName(false), "session");
});
