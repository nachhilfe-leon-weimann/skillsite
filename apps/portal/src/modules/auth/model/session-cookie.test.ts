import assert from "node:assert/strict";
import { test } from "vitest";

import {
  clearedSessionCookieOptions,
  sessionCookieName,
  sessionCookieOptions,
} from "./session-cookie";

test("a production build names the cookie with the __Host- prefix", () => {
  assert.equal(sessionCookieName(true), "__Host-session");
});

test("next dev, without HTTPS, names it without the prefix", () => {
  // The browser drops a `__Host-` cookie that is not `Secure`, and `Secure` needs HTTPS.
  assert.equal(sessionCookieName(false), "session");
});

test("in production the cookie is HttpOnly, SameSite=Lax, Path=/ and Secure, and lives as long as the session", () => {
  assert.deepEqual(sessionCookieOptions(true, 3600.7), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: true,
    // Rounded down: the cookie never outlives the session.
    maxAge: 3600,
  });
});

test("next dev sets the same attributes but Secure", () => {
  assert.deepEqual(sessionCookieOptions(false, 60), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 60,
  });
});

test("clearing the cookie repeats Secure and Path=/, without which the browser keeps a __Host- cookie", () => {
  assert.deepEqual(clearedSessionCookieOptions(true), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: true,
    maxAge: 0,
  });
});
