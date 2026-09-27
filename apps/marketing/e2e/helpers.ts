import type { Page } from "@playwright/test";

/** Answer every non-local request locally: the smoke test must not depend on the network (e.g. Umami). */
export async function isolate(page: Page) {
  await page.context().route(
    // Anchored at the host end (`(?::\d+)?\/`) so `localhost.example.com` isn't
    // mistaken for `localhost` and left unstubbed.
    /^https?:\/\/(?!(?:127\.0\.0\.1|localhost)(?::\d+)?\/)/,
    (route) => route.fulfill({ status: 204, body: "" }),
  );
}

/** Collect console errors and uncaught exceptions of a page. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

/** Stub the availability API: one bookable slot at 10:00 on the last day of whichever month is requested. */
export async function stubAvailability(page: Page) {
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
