import { expect, test, type Page } from "@playwright/test";

import { collectErrors, isolate, stubAvailability } from "./helpers";
import { indexablePaths, SITE_URL } from "../src/lib/routes";

/** Only the home page declares the root canonical; every other page, the 404 included, must not inherit it. */
async function expectRootCanonicalOnlyOnHome(page: Page, path: string) {
  const canonicals = await page
    .locator('link[rel="canonical"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  if (path === "/") expect(canonicals, "canonical").toEqual([SITE_URL]);
  else expect(canonicals, "canonical").not.toContain(SITE_URL);
}

/** The page opens with its h1, and no heading skips a level below the one before it. */
async function expectHeadingOutline(page: Page) {
  const levels = await page
    .locator("h1, h2, h3, h4, h5, h6")
    .evaluateAll((headings) =>
      headings.map((heading) => Number(heading.tagName.slice(1))),
    );
  expect(levels[0], "heading outline: the first heading is the h1").toBe(1);
  levels.forEach((level, i) => {
    if (i > 0)
      expect(
        level,
        `heading outline: heading ${i + 1} of ${levels.length}`,
      ).toBeLessThanOrEqual(levels[i - 1]! + 1);
  });
}

for (const path of indexablePaths) {
  test(`${path} renders without errors`, async ({ page }) => {
    await isolate(page);
    await stubAvailability(page);
    const errors = collectErrors(page);
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    // `goto` resolves at `load`; hydration and effects can still throw after that,
    // so wait for the network to settle (every non-local request is fulfilled
    // locally, so this doesn't hang) before trusting the error collector.
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main#main")).toBeVisible();
    expect(errors, "console errors").toEqual([]);
    await expectRootCanonicalOnlyOnHome(page, path);
    await expectHeadingOutline(page);
  });
}

for (const path of ["/termin", "/kontakt"]) {
  test(`the booker on ${path} reaches the slot list`, async ({ page }) => {
    await isolate(page);
    await stubAvailability(page);
    await page.goto(path);
    await expect(page.getByRole("button", { name: "10:00" })).toBeVisible();
  });
}

test("a valid payment link redirects to the PayPal checkout", async ({
  request,
}) => {
  const response = await request.get("/zahlung?re=RE-1840&betrag=90,00%20EUR", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toMatch(
    /^https:\/\/www\.paypal\.com\/cgi-bin\/webscr\?/,
  );
});

test("an invalid payment link renders a page instead of redirecting", async ({
  page,
}) => {
  await isolate(page);
  const errors = collectErrors(page);
  const path = "/zahlung?re=x&betrag=abc";
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main#main")).toBeVisible();
  expect(errors, "console errors").toEqual([]);
  await expectRootCanonicalOnlyOnHome(page, path);
});

test("an unknown route answers 404", async ({ page }) => {
  await isolate(page);
  const errors = collectErrors(page);
  const path = "/gibt-es-nicht";
  const response = await page.goto(path);
  expect(response?.status()).toBe(404);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main#main")).toBeVisible();
  // The browser logs its own line for the 404 document response itself - that
  // is the one expected message here, everything else would be a real bug.
  const unexpectedErrors = errors.filter(
    (message) => !/Failed to load resource: .* 404/.test(message),
  );
  expect(unexpectedErrors, "console errors").toEqual([]);
  // The not-found page once inherited the home page's canonical.
  await expectRootCanonicalOnlyOnHome(page, path);
});

test("a route in running text navigates without a page load", async ({
  page,
}) => {
  await isolate(page);
  await page.goto("/agb");
  // A page load drops this marker; a client-side navigation keeps the document.
  await page.evaluate(() => Object.assign(window, { navigationMarker: true }));
  await page
    .getByRole("main")
    .getByRole("link", { name: "Preisübersicht" })
    .click();
  await expect(page).toHaveURL(/\/preise$/);
  expect(await page.evaluate(() => "navigationMarker" in window)).toBe(true);
});
