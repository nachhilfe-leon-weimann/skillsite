import { expect, test, type Page } from "@playwright/test";

import { indexablePaths } from "../src/lib/routes";

/** Answer every non-local request locally: the smoke test must not depend on the network (e.g. Umami). */
async function isolate(page: Page) {
  await page.context().route(
    // Anchored at the host end (`(?::\d+)?\/`) so `localhost.example.com` isn't
    // mistaken for `localhost` and left unstubbed.
    /^https?:\/\/(?!(?:127\.0\.0\.1|localhost)(?::\d+)?\/)/,
    (route) => route.fulfill({ status: 204, body: "" }),
  );
}

/** Collect console errors and uncaught exceptions of a page. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

/** Stub the availability API: one bookable slot at 10:00 on the last day of whichever month is requested. */
async function stubAvailability(page: Page) {
  await page.route(/\/api\/booking\/availability\?/, (route) => {
    const url = new URL(route.request().url());
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const date = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return route.fulfill({
      json: {
        status: "ok",
        timeZone: "Europe/Berlin",
        days: [
          {
            date,
            slots: [{ time: "10:00", start: `${date}T10:00:00.000+02:00` }],
          },
        ],
      },
    });
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
