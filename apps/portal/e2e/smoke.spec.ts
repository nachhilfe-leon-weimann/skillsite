import { expect, test, type Page } from "@playwright/test";

// The model file, not the module's entry: the entry also exports the components, which Playwright cannot load.
import { sessionCookieName } from "../src/modules/auth/model/session-cookie";

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
 * A synthetic session cookie: enough for the proxy's optimistic check, which never validates it, not for the
 * `(admin)` layout. The smoke test runs a production build, so the cookie carries the `__Host-` prefix, which the
 * browser stores only from HTTPS - the test sends it as a request header instead.
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

test("the login and the admin area are never stored by a cache", async ({
  request,
}) => {
  // The admin area's responses carry the session's data; Next marks every dynamic response `no-store`.
  for (const path of ["/login", "/"]) {
    const response = await request.get(path, {
      maxRedirects: 0,
      headers: { cookie: `${sessionCookieName(true)}=synthetic` },
    });
    expect(response.headers()["cache-control"], path).toContain("no-store");
  }
});

test("/ without a session cookie redirects to /login", async ({ request }) => {
  const response = await request.get("/", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(new URL(response.headers()["location"]!, "http://x").pathname).toBe(
    "/login",
  );
});

test("/login without the SkillForge variables says the portal is not configured", async ({
  page,
}) => {
  const errors = collectErrors(page);
  const response = await page.goto("/login");
  expect(response?.status()).toBe(200);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("status")).toBeVisible();
  await expect(page.getByRole("button")).toHaveCount(0);
  expect(errors, "console errors").toEqual([]);
});

test("a session cookie the portal does not know lands on /login", async ({
  page,
}) => {
  // The proxy lets any cookie through; the (admin) layout checks it against the session store.
  await withSessionCookie(page);
  const errors = collectErrors(page);
  await page.goto("/");
  expect(new URL(page.url()).pathname).toBe("/login");
  await page.waitForLoadState("networkidle");
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
