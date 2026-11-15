import { expect, test, type Page } from "@playwright/test";

import { sessionCookieName } from "../src/modules/auth";

/** Collect console errors and uncaught exceptions of a page. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

/**
 * A synthetic session cookie: enough for the proxy's optimistic check, which never validates it. The smoke test runs
 * a production build, so the cookie carries the `__Host-` prefix, which the browser stores only from HTTPS - the test
 * sends it as a request header instead.
 */
async function withSessionCookie(page: Page) {
  await page.setExtraHTTPHeaders({
    cookie: `${sessionCookieName(true)}=synthetic`,
  });
}

test("/health reports ok and the version", async ({ request }) => {
  const response = await request.get("/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    status: "ok",
    version: expect.stringMatching(/^\d+\.\d+\.\d+/),
  });
});

test("every response keeps the portal out of frames and search engines", async ({
  request,
}) => {
  for (const path of ["/health", "/login", "/"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.headers()["x-frame-options"], path).toBe("DENY");
    expect(response.headers()["x-robots-tag"], path).toBe("noindex, nofollow");
  }
});

test("/ without a session cookie redirects to /login", async ({ request }) => {
  const response = await request.get("/", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(new URL(response.headers()["location"]!, "http://x").pathname).toBe(
    "/login",
  );
});

test("/login renders without errors", async ({ page }) => {
  const errors = collectErrors(page);
  const response = await page.goto("/login");
  expect(response?.status()).toBe(200);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors, "console errors").toEqual([]);
});

test("the start page renders with a session cookie", async ({ page }) => {
  await withSessionCookie(page);
  const errors = collectErrors(page);
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors, "console errors").toEqual([]);
});

test("an unknown route answers 404", async ({ page }) => {
  // Without a session the proxy would send it to /login first.
  await withSessionCookie(page);
  const errors = collectErrors(page);
  const response = await page.goto("/gibt-es-nicht");
  expect(response?.status()).toBe(404);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // The browser logs its own line for the 404 document response itself - that
  // is the one expected message here, everything else would be a real bug.
  const unexpectedErrors = errors.filter(
    (message) => !/Failed to load resource: .* 404/.test(message),
  );
  expect(unexpectedErrors, "console errors").toEqual([]);
});
