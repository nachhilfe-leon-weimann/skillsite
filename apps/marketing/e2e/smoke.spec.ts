import { expect, test } from "@playwright/test";

import { collectErrors, isolate, stubAvailability } from "./helpers";
import { indexablePaths, SITE_URL } from "../src/lib/routes";

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
    expect(errors).toEqual([]);
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
  const response = await page.goto("/zahlung?re=x&betrag=abc");
  expect(response?.status()).toBe(200);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main#main")).toBeVisible();
  expect(errors).toEqual([]);
});

test("an unknown route answers 404", async ({ page }) => {
  await isolate(page);
  const errors = collectErrors(page);
  const response = await page.goto("/gibt-es-nicht");
  expect(response?.status()).toBe(404);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main#main")).toBeVisible();
  // The browser logs its own line for the 404 document response itself - that
  // is the one expected message here, everything else would be a real bug.
  const unexpectedErrors = errors.filter(
    (message) => !/Failed to load resource: .* 404/.test(message),
  );
  expect(unexpectedErrors).toEqual([]);
});

for (const path of [
  ...indexablePaths,
  "/zahlung?re=x&betrag=abc",
  "/gibt-es-nicht",
]) {
  test(`${path} declares the root canonical only if it is the home page`, async ({
    page,
  }) => {
    await isolate(page);
    await page.goto(path);
    const canonicals = await page
      .locator('link[rel="canonical"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    if (path === "/") expect(canonicals).toEqual([SITE_URL]);
    else expect(canonicals).not.toContain(SITE_URL);
  });
}
