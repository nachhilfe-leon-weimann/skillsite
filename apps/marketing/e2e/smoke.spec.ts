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

// The payment page runs against the SkillForge stub (`e2e/stubs/skillforge.mjs`), which the Playwright config starts
// with the app: synthetic invoices only, one per answer the lookup can get.

test("an old link pays sevDesk's amount, not the link's", async ({
  request,
}) => {
  const response = await request.get("/zahlung?re=RE-1001&betrag=90,00%20EUR", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(307);
  const location = response.headers()["location"] ?? "";
  expect(location).toMatch(/^https:\/\/www\.paypal\.com\//);
  expect(location).toContain("amount=22.50&invoice=RE-1001");
});

test("the form leads to the lookup", async ({ page }) => {
  await isolate(page);
  // The form's own request is routed and answered locally: the page's redirect is read, never followed. A request
  // the browser makes by following a redirect bypasses every route, so PayPal would load for real.
  let formQuery: URLSearchParams | undefined;
  let location: string | undefined;
  await page.route(/\/zahlung\?re=/, async (route) => {
    formQuery = new URL(route.request().url()).searchParams;
    const response = await route.fetch({ maxRedirects: 0 });
    location = response.headers()["location"];
    // An empty page commits the navigation the click waits for; a 204 would leave it pending.
    await route.fulfill({ status: 200, contentType: "text/html", body: "" });
  });
  await page.goto("/zahlung");
  await page.getByLabel("Rechnungsnummer").fill("re-1001");
  await page.getByRole("button", { name: "Weiter zu PayPal" }).click();
  await expect.poll(() => location, "the page's redirect").toBeDefined();
  expect(formQuery?.get("re")).toBe("re-1001");
  expect(location).toMatch(/^https:\/\/www\.paypal\.com\//);
  expect(new URL(location!).searchParams.get("invoice")).toBe("RE-1001");
});

const paymentStates = [
  {
    invoice: "RE-1002",
    state: "blocked",
    title: "Bitte per Überweisung zahlen.",
    lead: "RE-1002",
  },
  {
    invoice: "RE-1003",
    state: "paid",
    title: "Diese Rechnung ist schon bezahlt. Danke!",
  },
  {
    invoice: "RE-1004",
    state: "not payable",
    title: "Diese Rechnung finde ich nicht.",
    field: true,
  },
  {
    invoice: "RE-1005",
    state: "unavailable",
    title: "Die Zahlung ist gerade nicht erreichbar.",
  },
];

for (const { invoice, state, title, lead, field } of paymentStates) {
  test(`${invoice} (${state}) renders its page without a redirect`, async ({
    page,
  }) => {
    await isolate(page);
    const errors = collectErrors(page);
    const path = `/zahlung?re=${invoice}`;
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    expect(response?.request().redirectedFrom(), "redirect").toBeNull();
    expect(new URL(page.url()).pathname).toBe("/zahlung");
    await page.waitForLoadState("networkidle");
    const heading = page.getByRole("heading", { level: 1, name: title });
    await expect(heading).toBeVisible();
    if (lead) await expect(page.getByText(lead)).toBeVisible();
    if (field) await expect(page.getByLabel("Rechnungsnummer")).toBeVisible();
    expect(errors, "console errors").toEqual([]);
  });
}

test("an invalid payment link renders a page instead of redirecting", async ({
  page,
}) => {
  await isolate(page);
  const errors = collectErrors(page);
  const path = "/zahlung?re=RE%2F1840&betrag=abc";
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main#main")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Dieser Zahlungslink führt nicht weiter.",
    }),
  ).toBeVisible();
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
