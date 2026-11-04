import { expect, test, type Page } from "@playwright/test";

import {
  collectErrors,
  freezeTime,
  isolate,
  moveTime,
  settledRequests,
  stubMonths,
  type MonthAnswer,
} from "./helpers";

/*
 * The booking calendar on both booking routes, against stubbed availability
 * and a fixed clock. Nothing is booked: no test submits, except the one that
 * aborts its server action in the browser.
 */

const routes = {
  "/termin": { duration: "60" },
  "/kontakt": { duration: "15" },
} as const;

/** 2026-11-04 12:00 in Berlin: the window is November 2026 to February 2027. */
const NOVEMBER = new Date("2026-11-04T11:00:00Z");

async function open(
  page: Page,
  path: string,
  answers: Record<string, MonthAnswer>,
  { now = NOVEMBER, hold = [] as string[] } = {},
) {
  await isolate(page);
  await freezeTime(page, now);
  const stub = await stubMonths(page, answers);
  for (const month of hold) stub.hold(month);
  await page.goto(path);
  return stub;
}

const grid = (page: Page) => page.getByRole("grid");
/** A day by its label, "Dienstag, 8. Dezember 2026"; today's and the selected one's add to it. */
const day = (page: Page, label: string) =>
  grid(page).getByRole("button", { name: label });
const focusedLabel = (page: Page) =>
  page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
const selectedDay = (page: Page) =>
  grid(page).locator("[aria-selected=true] button");
const tabStops = (page: Page) => grid(page).locator('button[tabindex="0"]');
const next = (page: Page) =>
  page.getByRole("button", { name: "Nächster Monat" });
const previous = (page: Page) =>
  page.getByRole("button", { name: "Vorheriger Monat" });
const slot = (page: Page) => page.getByRole("button", { name: "10:00 Uhr" });

/** Focus the grid's tab stop from the month buttons, as a keyboard user does. */
async function tabIntoGrid(page: Page) {
  await next(page).focus();
  await page.keyboard.press("Tab");
  await expect(tabStops(page)).toBeFocused();
}

for (const [path, { duration }] of Object.entries(routes)) {
  const at = (month: string) => `${month}@${duration}`;

  test.describe(`${path} calendar`, () => {
    test("the first load moves on to a month with a free day, selects it and leaves focus alone", async ({
      page,
    }) => {
      const stub = await open(page, path, {
        "2026-11": [],
        "2026-12": ["2026-12-08", "2026-12-15"],
      });
      await expect(grid(page)).toHaveAccessibleName("Dezember 2026");
      await expect(selectedDay(page)).toHaveAccessibleName(
        "Dienstag, 8. Dezember 2026, ausgewählt",
      );
      await expect(slot(page)).toBeVisible();
      expect(await settledRequests(page, stub.requests)).toEqual([
        at("2026-11"),
        at("2026-12"),
      ]);
      expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
        "BODY",
      );
      await expect(tabStops(page)).toHaveCount(1);
    });

    test("a month asked for by button stays empty, keeps focus on the button and selects nothing", async ({
      page,
    }) => {
      const stub = await open(page, path, { "2026-11": ["2026-11-20"] });
      await expect(selectedDay(page)).toHaveAccessibleName(/20\. November/);
      await next(page).click();
      await expect(grid(page)).toHaveAccessibleName("Dezember 2026");
      await expect(
        page.getByText("In diesem Monat sind keine Termine frei."),
      ).toBeVisible();
      await expect(next(page)).toBeFocused();
      await expect(selectedDay(page)).toHaveCount(0);
      await expect(slot(page)).toHaveCount(0);
      await expect(grid(page)).toHaveAttribute("aria-busy", "false");
      await expect(tabStops(page)).toHaveCount(1);
      expect(await settledRequests(page, stub.requests)).toEqual([
        at("2026-11"),
        at("2026-12"),
      ]);
      await expect(grid(page)).toHaveAccessibleName("Dezember 2026");
    });

    test("one tab stop; arrows move focus without selecting; Enter and Space pick only a free day", async ({
      page,
    }) => {
      const stub = await open(page, path, {
        "2026-11": ["2026-11-12", "2026-11-19"],
      });
      await expect(selectedDay(page)).toHaveAccessibleName(/12\. November/);
      await tabIntoGrid(page);
      expect(await focusedLabel(page)).toBe(
        "Donnerstag, 12. November 2026, ausgewählt",
      );

      await page.keyboard.press("ArrowLeft");
      const unavailable = day(page, "Mittwoch, 11. November 2026");
      await expect(unavailable).toBeFocused();
      await expect(unavailable).toHaveAttribute("aria-disabled", "true");
      for (const key of ["Enter", "Space"]) await page.keyboard.press(key);
      await expect(unavailable).toBeFocused();
      await expect(selectedDay(page)).toHaveAccessibleName(/12\. November/);
      await expect(page.getByText("Do., 12. November")).toBeVisible();

      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowRight");
      const free = day(page, "Donnerstag, 19. November 2026");
      await expect(free).toBeFocused();
      await expect(selectedDay(page)).toHaveAccessibleName(/12\. November/);
      await page.keyboard.press("Enter");
      await expect(free).toBeFocused();
      await expect(selectedDay(page)).toHaveAccessibleName(
        "Donnerstag, 19. November 2026, ausgewählt",
      );
      await expect(page.getByText("Do., 19. November")).toBeVisible();

      await page.keyboard.press("Home");
      await expect(day(page, "Montag, 16. November 2026")).toBeFocused();
      await page.keyboard.press("End");
      await expect(day(page, "Sonntag, 22. November 2026")).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("Space");
      await expect(selectedDay(page)).toHaveAccessibleName(/19\. November/);

      // Tab leaves the grid for the slots; Shift+Tab returns to the last day.
      await page.keyboard.press("Tab");
      await expect(slot(page)).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(free).toBeFocused();
      await expect(tabStops(page)).toHaveCount(1);
      expect(await settledRequests(page, stub.requests)).toEqual([
        at("2026-11"),
      ]);
    });

    test("keys that leave the month take the button path; focus waits on the requested day", async ({
      page,
    }) => {
      // One free day, the month's last; the next month has no data yet.
      const stub = await open(
        page,
        path,
        { "2026-11": ["2026-11-30"], "2027-01": ["2027-01-15"] },
        { hold: ["2026-12"] },
      );
      await expect(selectedDay(page)).toHaveAccessibleName(/30\. November/);
      await tabIntoGrid(page);

      await page.keyboard.press("ArrowRight");
      const requested = day(page, "Dienstag, 1. Dezember 2026");
      await expect(requested).toBeFocused();
      await expect(grid(page)).toHaveAccessibleName("Dezember 2026");
      await expect(grid(page)).toHaveAttribute("aria-busy", "true");
      await expect(selectedDay(page)).toHaveCount(0);
      await expect(slot(page)).toHaveCount(0);
      await expect(tabStops(page)).toHaveCount(1);
      await expect(requested).toHaveAttribute("aria-disabled", "true");
      expect(stub.requests).toEqual([at("2026-11"), at("2026-12")]);

      // The empty answer keeps the requested day focused and the month shown.
      await stub.release("2026-12");
      await expect(grid(page)).toHaveAttribute("aria-busy", "false");
      await expect(requested).toBeFocused();
      await expect(requested).toHaveAttribute("aria-disabled", "true");
      await expect(tabStops(page)).toHaveCount(1);
      await expect(
        page.getByText("In diesem Monat sind keine Termine frei."),
      ).toBeVisible();

      // PageDown: the next month; its answer selects a day but takes no focus.
      await page.keyboard.press("PageDown");
      const january = day(page, "Freitag, 1. Januar 2027");
      await expect(january).toBeFocused();
      await expect(selectedDay(page)).toHaveAccessibleName(
        "Freitag, 15. Januar 2027, ausgewählt",
      );
      await expect(slot(page)).toBeVisible();
      await expect(january).toBeFocused();

      // The last month: the bound holds without a request.
      await page.keyboard.press("PageDown");
      await expect(day(page, "Montag, 1. Februar 2027")).toBeFocused();
      await page.keyboard.press("PageDown");
      await expect(day(page, "Sonntag, 28. Februar 2027")).toBeFocused();
      for (const key of ["ArrowRight", "ArrowDown", "End", "PageDown"])
        await page.keyboard.press(key);
      await expect(day(page, "Sonntag, 28. Februar 2027")).toBeFocused();
      await expect(next(page)).toBeDisabled();
      expect(await settledRequests(page, stub.requests)).toEqual([
        at("2026-11"),
        at("2026-12"),
        at("2027-01"),
        at("2027-02"),
      ]);
    });

    test("the first month's start holds without a request", async ({
      page,
    }) => {
      const stub = await open(page, path, { "2026-11": ["2026-11-02"] });
      await expect(selectedDay(page)).toHaveAccessibleName(/2\. November/);
      await tabIntoGrid(page);
      for (const key of ["ArrowLeft", "ArrowUp", "PageUp", "Home"])
        await page.keyboard.press(key);
      await expect(day(page, "Sonntag, 1. November 2026")).toBeFocused();
      await expect(previous(page)).toBeDisabled();
      expect(await settledRequests(page, stub.requests)).toEqual([
        at("2026-11"),
      ]);
    });

    test("a stale month's late answer is ignored", async ({ page }) => {
      const stub = await open(
        page,
        path,
        {
          "2026-11": ["2026-11-30"],
          "2026-12": ["2026-12-01"],
          "2027-01": ["2027-01-20"],
        },
        { hold: ["2026-12"] },
      );
      await expect(selectedDay(page)).toHaveAccessibleName(/30\. November/);
      await tabIntoGrid(page);
      await page.keyboard.press("PageDown");
      await page.keyboard.press("PageDown");
      await expect(day(page, "Samstag, 30. Januar 2027")).toBeFocused();
      await expect(selectedDay(page)).toHaveAccessibleName(/20\. Januar/);
      await stub.release("2026-12");
      await page.waitForLoadState("networkidle");
      await expect(grid(page)).toHaveAccessibleName("Januar 2027");
      await expect(selectedDay(page)).toHaveAccessibleName(/20\. Januar/);
      await expect(day(page, "Samstag, 30. Januar 2027")).toBeFocused();
    });

    test("an error after a keyboard month change hands focus to Retry, which loads the month again", async ({
      page,
    }) => {
      const stub = await open(page, path, {
        "2026-11": ["2026-11-30"],
        "2026-12": "error",
      });
      await expect(selectedDay(page)).toHaveAccessibleName(/30\. November/);
      await tabIntoGrid(page);
      await page.keyboard.press("ArrowRight");
      const retry = page.getByRole("button", { name: "Erneut versuchen" });
      await expect(retry).toBeFocused();
      expect(
        await retry.evaluate((node) => node.matches(":focus-visible")),
      ).toBe(true);
      stub.answers["2026-12"] = ["2026-12-03"];
      await page.keyboard.press("Enter");
      await expect(grid(page)).toHaveAccessibleName("Dezember 2026");
      await expect(selectedDay(page)).toHaveAccessibleName(
        "Donnerstag, 3. Dezember 2026, ausgewählt",
      );
      expect(await settledRequests(page, stub.requests)).toEqual([
        at("2026-11"),
        at("2026-12"),
        at("2026-12"),
      ]);
    });

    for (const answer of ["error", "unconfigured"] as const)
      test(`a click on a month button into ${answer === "error" ? "an error" : "an unconfigured answer"} moves neither focus nor the page, on a phone`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await open(page, path, {
          "2026-11": ["2026-11-30"],
          "2026-12": answer,
        });
        await expect(selectedDay(page)).toHaveAccessibleName(/30\. November/);
        // The month button near the bottom of the viewport.
        const box = (await next(page).boundingBox())!;
        await page.evaluate(
          (top) => window.scrollTo(0, top),
          Math.round(box.y + (await page.evaluate(() => scrollY)) - 844 + 120),
        );
        await expect
          .poll(() => page.evaluate(() => scrollY))
          .toBeGreaterThan(0);
        const before = await page.evaluate(() => scrollY);
        await next(page).click();
        await expect(page.getByRole("heading", { level: 3 })).toBeVisible();
        await page.waitForTimeout(800);
        // As on main: the page stays where it was, and focus left with the
        // clicked button for <body>.
        expect(await page.evaluate(() => scrollY)).toBe(before);
        expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
          "BODY",
        );
      });

    test("an error never takes focus from another control", async ({
      page,
    }) => {
      const stub = await open(
        page,
        path,
        { "2026-11": "error" },
        { hold: ["2026-11"] },
      );
      await expect(grid(page)).toHaveAttribute("aria-busy", "true");
      const home = page.getByRole("link", { name: "Startseite" }).first();
      await home.focus();
      await stub.release("2026-11");
      await expect(
        page.getByRole("button", { name: "Erneut versuchen" }),
      ).toBeVisible();
      await expect(home).toBeFocused();
    });

    test("an unconfigured answer after a keyboard month change focuses its notice", async ({
      page,
    }) => {
      await open(page, path, {
        "2026-11": ["2026-11-30"],
        "2026-12": "unconfigured",
      });
      await expect(selectedDay(page)).toHaveAccessibleName(/30\. November/);
      await tabIntoGrid(page);
      await page.keyboard.press("PageDown");
      const title = page.getByRole("heading", {
        name: "Online-Terminwahl gerade nicht verfügbar",
      });
      await expect(title).toBeVisible();
      const notice = title.locator("..");
      await expect(notice).toBeFocused();
      await expect(notice).toHaveAttribute("tabindex", "-1");
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("link", { name: "Direkt anfragen" }),
      ).toBeFocused();
    });

    test("a picked day shows its slots, and a slot opens the form", async ({
      page,
    }) => {
      await open(page, path, { "2026-11": ["2026-11-12", "2026-11-19"] });
      await expect(selectedDay(page)).toHaveAccessibleName(/12\. November/);
      await day(page, "Donnerstag, 19. November 2026").click();
      await expect(page.getByText("Do., 19. November")).toBeVisible();
      await slot(page).click();
      await expect(page.getByText("Deine Daten")).toBeVisible();
      await expect(
        page.getByText("Do., 19. November – 10:00 Uhr").first(),
      ).toBeVisible();
    });

    test("the focused day shows the focus ring, light and dark", async ({
      page,
    }) => {
      for (const colorScheme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme });
        await open(page, path, { "2026-11": ["2026-11-12", "2026-11-19"] });
        await expect(selectedDay(page)).toHaveAccessibleName(/12\. November/);
        await tabIntoGrid(page);
        const ring = await page.evaluate(() => {
          const probe = document.createElement("div");
          probe.style.color = "var(--focus-ring-color)";
          document.body.append(probe);
          const color = getComputedStyle(probe).color;
          probe.remove();
          return color;
        });
        // The selected day, a free one and an unavailable one.
        for (const key of [null, "ArrowDown", "ArrowLeft"]) {
          if (key) await page.keyboard.press(key);
          const focused = page.locator(":focus");
          expect(
            await focused.evaluate((node) => node.matches(":focus-visible")),
          ).toBe(true);
          await expect(focused).toHaveCSS("outline-style", "solid");
          await expect(focused).toHaveCSS("outline-width", "3px");
          await expect(focused).toHaveCSS("outline-offset", "3px");
          await expect(focused).toHaveCSS("outline-color", ring);
        }
      }
    });
  });
}

/** Records each `animationstart` on the calendar's day rows: "fade" per start. */
async function recordDayFades(page: Page) {
  await page.addInitScript(() => {
    const starts: string[] = [];
    Object.assign(window, { dayFades: starts });
    document.addEventListener("animationstart", (event) => {
      const target = event.target as Element;
      if (target.matches("[role=grid] [role=rowgroup]"))
        starts.push(event.animationName);
    });
  });
  return () =>
    page.evaluate(() => (window as unknown as { dayFades: string[] }).dayFades);
}

test("a new month's days fade in and end fully shown", async ({ page }) => {
  const fades = await recordDayFades(page);
  await open(page, "/termin", {
    "2026-11": ["2026-11-12"],
    "2026-12": ["2026-12-03"],
  });
  await expect(selectedDay(page)).toHaveAccessibleName(/12\. November/);
  // Loading may already have faded one or two months in: two when the server
  // rendered another month, which hydration then swaps for the visitor's.
  const loaded = (await fades()).length;
  await next(page).click();
  await expect(grid(page)).toHaveAccessibleName("Dezember 2026");
  await expect.poll(async () => (await fades()).length).toBe(loaded + 1);
  await expect(grid(page).getByRole("rowgroup")).toHaveCSS("opacity", "1");
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the days do not fade", async ({ page }) => {
    const fades = await recordDayFades(page);
    await open(page, "/termin", { "2026-11": ["2026-11-12"] });
    await expect(selectedDay(page)).toHaveAccessibleName(/12\. November/);
    await next(page).click();
    await expect(grid(page)).toHaveAccessibleName("Dezember 2026");
    await page.waitForTimeout(300);
    expect(await fades()).toEqual([]);
  });
});

test("/termin: a new duration clears the selection and searches forward again", async ({
  page,
}) => {
  const stub = await open(page, "/termin", {
    "2026-11": [],
    "2026-12": ["2026-12-08"],
  });
  await expect(selectedDay(page)).toHaveAccessibleName(/8\. Dezember/);
  await previous(page).click();
  await expect(grid(page)).toHaveAccessibleName("November 2026");
  await expect(selectedDay(page)).toHaveCount(0);
  await page.getByRole("combobox", { name: "Dauer", exact: true }).click();
  await page.getByRole("option", { name: "90 Minuten" }).click();
  await expect(grid(page)).toHaveAccessibleName("Dezember 2026");
  await expect(selectedDay(page)).toHaveAccessibleName(/8\. Dezember/);
  expect(await settledRequests(page, stub.requests)).toEqual([
    "2026-11@60",
    "2026-12@60",
    "2026-11@60",
    "2026-11@90",
    "2026-12@90",
  ]);
});

test("/kontakt keeps its fixed duration", async ({ page }) => {
  const stub = await open(page, "/kontakt", { "2026-11": ["2026-11-12"] });
  await expect(selectedDay(page)).toHaveAccessibleName(/12\. November/);
  await expect(page.getByRole("combobox", { name: "Dauer" })).toHaveCount(0);
  await expect(page.getByText("15 Minuten")).toBeVisible();
  expect(await settledRequests(page, stub.requests)).toEqual(["2026-11@15"]);
});

/*
 * The booking zone is Europe/Berlin, whatever the visitor's: the same API date is
 * the same day in the grid, its label, the slot list and the form, across the
 * DST changes (2026-03-29, 2026-10-25) and the year's end.
 */
for (const timezoneId of [
  "Europe/Berlin",
  "America/Los_Angeles",
  "Pacific/Auckland",
]) {
  test.describe(`visitor in ${timezoneId}`, () => {
    test.use({ timezoneId });

    for (const path of Object.keys(routes)) {
      test(`${path}: 2026-03-29 stays the same day from grid to form`, async ({
        page,
      }) => {
        // 2026-03-20 12:00 in Berlin: already the 21st in Auckland.
        await open(
          page,
          path,
          { "2026-03": ["2026-03-29", "2026-03-30"] },
          { now: new Date("2026-03-20T11:00:00Z") },
        );
        await expect(grid(page)).toHaveAccessibleName("März 2026");
        await expect(day(page, "Heute, Freitag, 20. März 2026")).toBeVisible();
        const selected = selectedDay(page);
        await expect(selected).toHaveAccessibleName(
          "Sonntag, 29. März 2026, ausgewählt",
        );
        await expect(selected).toHaveText("29");
        await expect(
          grid(page).locator("[aria-selected=true]"),
        ).toHaveAttribute("data-day", "2026-03-29");
        await expect(page.getByText("So., 29. März")).toBeVisible();
        await day(page, "Montag, 30. März 2026").click();
        await expect(page.getByText("Mo., 30. März")).toBeVisible();
        await day(page, "Sonntag, 29. März 2026").click();
        await slot(page).click();
        await expect(
          page.getByText("So., 29. März – 10:00 Uhr").first(),
        ).toBeVisible();
      });

      test(`${path}: 2026-10-25 stays the same day, and the keys roll into 2027`, async ({
        page,
      }) => {
        const stub = await open(
          page,
          path,
          { "2026-10": ["2026-10-25"], "2027-01": ["2027-01-04"] },
          { now: new Date("2026-10-20T10:00:00Z") },
        );
        await expect(selectedDay(page)).toHaveAccessibleName(
          "Sonntag, 25. Oktober 2026, ausgewählt",
        );
        await expect(page.getByText("So., 25. Oktober")).toBeVisible();
        await tabIntoGrid(page);
        for (let i = 0; i < 3; i++) await page.keyboard.press("PageDown");
        const january = day(page, "Montag, 25. Januar 2027");
        await expect(january).toBeFocused();
        await expect(selectedDay(page)).toHaveAccessibleName(
          "Montag, 4. Januar 2027, ausgewählt",
        );
        await expect(january).toBeFocused();
        await page.keyboard.press("PageDown");
        await expect(day(page, "Sonntag, 31. Januar 2027")).toBeFocused();
        const months = (await settledRequests(page, stub.requests)).map(
          (request) => request.split("@")[0],
        );
        expect(months).toEqual(["2026-10", "2026-11", "2026-12", "2027-01"]);
      });
    }

    test("/termin: the slot sent is the API's instant, not one rebuilt from the day", async ({
      page,
    }) => {
      // Abort every submission in the browser: nothing reaches the server.
      const bodies: string[] = [];
      await page.route("**/*", (route) => {
        if (route.request().method() === "GET") return route.fallback();
        bodies.push(route.request().postData() ?? "");
        return route.abort();
      });
      await open(
        page,
        "/termin",
        { "2026-10": ["2026-10-25"] },
        { now: new Date("2026-10-20T10:00:00Z") },
      );
      await slot(page).click();
      await page.getByRole("textbox", { name: "Vorname" }).fill("Erika");
      await page.getByRole("textbox", { name: "Nachname" }).fill("Beispiel");
      await page
        .getByRole("textbox", { name: "E-Mail" })
        .fill("erika@example.com");
      await page.getByRole("radio", { name: "Physik", exact: true }).click();
      await page.getByRole("checkbox", { name: /Widerrufsfrist/ }).check();
      await page
        .getByRole("button", { name: "Zahlungspflichtig buchen" })
        .click();
      await expect.poll(() => bodies.length).toBe(1);
      const [draft] = JSON.parse(bodies[0]!) as { slot: string }[];
      // 10:00 in Berlin after the change back to winter time.
      expect(draft!.slot).toBe("2026-10-25T10:00:00.000+01:00");
    });
  });
}

/** A Berlin day of `instant` as the calendar names it: "Freitag, 20. März 2026". */
const berlinDayLabel = (instant: Date) =>
  new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(instant);
const berlinDate = (instant: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(
    instant,
  );

for (const [path, { duration }] of Object.entries(routes)) {
  test(`the booker on ${path} hydrates on a later day than the server rendered`, async ({
    page,
  }) => {
    // `/termin` is prerendered, so its HTML carries the build day; `/kontakt`
    // carries the request's. A visitor on another day must hydrate without a
    // mismatch and then see their own month, fetching only that one.
    const later = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000);
    const visitorDay = berlinDate(later);
    const visitorMonth = visitorDay.slice(0, 7);
    const errors = collectErrors(page);
    const stub = await open(
      page,
      path,
      { [visitorMonth]: [visitorDay] },
      { now: later },
    );
    await expect(
      day(page, `Heute, ${berlinDayLabel(later)}, ausgewählt`),
    ).toBeVisible();
    expect(await settledRequests(page, stub.requests)).toEqual([
      `${visitorMonth}@${duration}`,
    ]);
    expect(errors).toEqual([]);
  });
}

test("/termin: midnight at a month's end leaves the shown month and the choice alone", async ({
  page,
}) => {
  // 30 November 23:55 in Berlin.
  const stub = await open(
    page,
    "/termin",
    { "2026-11": ["2026-11-30"], "2026-12": ["2026-12-10"] },
    { now: new Date("2026-11-30T22:55:00Z") },
  );
  await expect(selectedDay(page)).toHaveAccessibleName(/30\. November/);
  // 1 December 00:05 in Berlin, the page still open: pick, then go back.
  await moveTime(page, new Date("2026-11-30T23:05:00Z"));
  await slot(page).click();
  await page.getByRole("button", { name: "Zurück zur Terminwahl" }).click();
  await expect(grid(page)).toHaveAccessibleName("November 2026");
  await expect(selectedDay(page)).toHaveAccessibleName(/30\. November/);
  expect(await settledRequests(page, stub.requests)).toEqual(["2026-11@60"]);
});
