import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const story = (name: string, theme = "light") =>
  `/iframe.html?id=forms-calendar--${name}&viewMode=story&globals=theme:${theme}`;
const grid = (page: Page) => page.getByRole("grid");
const day = (page: Page, label: string) =>
  grid(page).getByRole("button", { name: label });
const tabStops = (page: Page) => grid(page).locator('button[tabindex="0"]');
const status = (page: Page) => page.getByRole("status");
const before = (page: Page) => page.getByRole("button", { name: "Davor" });
const after = (page: Page) => page.getByRole("button", { name: "Danach" });
const next = (page: Page) =>
  page.getByRole("button", { name: "Nächster Monat" });
const previous = (page: Page) =>
  page.getByRole("button", { name: "Vorheriger Monat" });

/** A token, resolved on this page and theme as a computed colour. */
function token(page: Page, name: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, name);
}

/** The keyboard focus ring: the base outline in the focus ring token. */
async function expectRing(page: Page, element: Locator) {
  await expect(element).toBeFocused();
  expect(await element.evaluate((node) => node.matches(":focus-visible"))).toBe(
    true,
  );
  await expect(element).toHaveCSS("outline-style", "solid");
  await expect(element).toHaveCSS("outline-width", "3px");
  await expect(element).toHaveCSS("outline-offset", "3px");
  await expect(element).toHaveCSS(
    "outline-color",
    await token(page, "--focus-ring-color"),
  );
}

for (const theme of ["light", "dark"]) {
  test(`${theme}: one tab stop on the selected day; the ring shows on every kind of day`, async ({
    page,
  }) => {
    await page.goto(story("default", theme));
    await expect(grid(page)).toHaveAccessibleName("November 2026");
    await before(page).focus();
    // "Vorheriger Monat" is disabled in the first month.
    await page.keyboard.press("Tab");
    const selected = day(page, "Donnerstag, 5. November 2026, ausgewählt");
    await expect(next(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await expectRing(page, selected);
    await expect(tabStops(page)).toHaveCount(1);
    await expect(selected).toHaveCSS(
      "background-color",
      await token(page, "--coral"),
    );

    await page.keyboard.press("ArrowRight");
    const unavailable = day(page, "Freitag, 6. November 2026");
    await expectRing(page, unavailable);
    await expect(unavailable).toHaveAttribute("aria-disabled", "true");
    await expect(unavailable).not.toHaveAttribute("disabled");

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    const free = day(page, "Dienstag, 10. November 2026");
    await expectRing(page, free);
    await expect(free).not.toHaveAttribute("aria-disabled");

    await page.keyboard.press("Tab");
    await expect(after(page)).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expectRing(page, free);
  });
}

test("Enter and Space pick only a free day; arrows, Home and End pick nothing", async ({
  page,
}) => {
  await page.goto(story("default"));
  await day(page, "Donnerstag, 5. November 2026").focus();
  for (const key of ["ArrowRight", "Enter", "Space", "Home", "Enter", "End"])
    await page.keyboard.press(key);
  await expect(day(page, "Sonntag, 8. November 2026")).toBeFocused();
  await expect(status(page)).toHaveText("Auswahl: 2026-11-05, Monate: -");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await expect(status(page)).toHaveText("Auswahl: 2026-11-10, Monate: -");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(status(page)).toHaveText("Auswahl: 2026-11-19, Monate: -");
  await expect(
    day(page, "Donnerstag, 19. November 2026, ausgewählt"),
  ).toBeFocused();
});

test("a click picks a free day; a click on another day picks nothing", async ({
  page,
}) => {
  await page.goto(story("default"));
  await day(page, "Freitag, 6. November 2026").click({ force: true });
  await expect(status(page)).toHaveText("Auswahl: 2026-11-05, Monate: -");
  await day(page, "Dienstag, 10. November 2026").click();
  await expect(status(page)).toHaveText("Auswahl: 2026-11-10, Monate: -");
  await expect(day(page, "Dienstag, 10. November 2026")).toBeFocused();
});

test("PageUp/PageDown and the buttons ask for months within the bounds", async ({
  page,
}) => {
  await page.goto(story("default"));
  await day(page, "Donnerstag, 5. November 2026").focus();
  await page.keyboard.press("PageDown");
  await expect(day(page, "Samstag, 5. Dezember 2026")).toBeFocused();
  await expect(grid(page)).toHaveAccessibleName("Dezember 2026");
  await page.keyboard.press("Shift+PageDown");
  await expect(day(page, "Sonntag, 28. Februar 2027")).toBeFocused();
  for (const key of ["ArrowRight", "PageDown", "End"])
    await page.keyboard.press(key);
  await expect(day(page, "Sonntag, 28. Februar 2027")).toBeFocused();
  await expect(next(page)).toBeDisabled();
  await expect(status(page)).toHaveText(
    "Auswahl: keine, Monate: 2026-12 2027-02",
  );
  await previous(page).click();
  await expect(previous(page)).toBeFocused();
  await expect(grid(page)).toHaveAccessibleName("Januar 2027");
  await page.keyboard.press("Enter");
  await expect(previous(page)).toBeFocused();
  await expect(status(page)).toHaveText(
    "Auswahl: keine, Monate: 2026-12 2027-02 2027-01 2026-12",
  );
});

test("weekdays and days are named for assistive technology", async ({
  page,
}) => {
  await page.goto(story("default"));
  await expect(page.getByRole("columnheader")).toHaveText([
    "Mo",
    "Di",
    "Mi",
    "Do",
    "Fr",
    "Sa",
    "So",
  ]);
  await expect(
    page.getByRole("columnheader", { name: "Mittwoch" }),
  ).toBeVisible();
  await expect(day(page, "Heute, Mittwoch, 4. November 2026")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(grid(page).locator("[aria-selected=true]")).toHaveCount(1);
  // The caption is plain text, as before: the grid's name carries the month.
  await expect(page.getByRole("status")).toHaveCount(1);
});

test("without a free day every day stays focusable and nothing is picked", async ({
  page,
}) => {
  await page.goto(story("no-available-days"));
  await expect(tabStops(page)).toHaveCount(1);
  await expect(grid(page).getByRole("button")).toHaveCount(30);
  for (const button of await grid(page).getByRole("button").all())
    await expect(button).toHaveAttribute("aria-disabled", "true");
  await tabStops(page).focus();
  await expect(tabStops(page)).toHaveAccessibleName(/^Heute/);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(day(page, "Donnerstag, 5. November 2026")).toBeFocused();
  await expect(status(page)).toHaveText("Auswahl: keine, Monate: -");
});

test("loading: the grid is busy, the days pulse and none can be picked", async ({
  page,
}) => {
  await page.goto(story("loading"));
  await expect(grid(page)).toHaveAttribute("aria-busy", "true");
  await expect(tabStops(page)).toHaveCount(1);
  const free = day(page, "Dienstag, 10. November 2026");
  await expect(free).toHaveAttribute("aria-disabled", "true");
  await expect(free).toHaveCSS("animation-name", "pulse");
  await free.focus();
  await page.keyboard.press("Enter");
  await expect(status(page)).toHaveText("Auswahl: keine, Monate: -, lädt");
});

test("the requested day keeps focus through loading", async ({ page }) => {
  await page.goto(story("load-on-month-change"));
  await day(page, "Mittwoch, 4. November 2026").focus();
  await page.keyboard.press("PageDown");
  const requested = day(page, "Freitag, 4. Dezember 2026");
  await expect(requested).toBeFocused();
  await expect(grid(page)).toHaveAttribute("aria-busy", "true");
  await expect(grid(page)).toHaveAttribute("aria-busy", "false");
  await expect(requested).toBeFocused();
  await expect(requested).toHaveAttribute("aria-disabled", "true");
  await expect(tabStops(page)).toHaveCount(1);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");
  await expect(status(page)).toHaveText("Auswahl: 2026-12-03, Monate: 2026-12");
});

test("look: square days on a seven-column grid with 6px gaps; 36px month buttons", async ({
  page,
}) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(story("default"));
    await expect(grid(page).getByRole("button")).toHaveCount(30);
    const boxes = await grid(page)
      .getByRole("button")
      .evaluateAll((buttons) =>
        buttons.slice(0, 8).map((button) => {
          const box = button.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        }),
      );
    // November 2026 starts on a Sunday: the 1st, then a full week.
    const [first, second, , , , , , eighth] = boxes;
    expect(first!.width).toBeCloseTo(first!.height, 1);
    expect(eighth!.x).toBeCloseTo(first!.x, 1);
    expect(second!.y - first!.y).toBeCloseTo(first!.height + 6, 1);
    expect(eighth!.x - second!.x).toBeCloseTo(6 * (first!.width + 6), 1);
    for (const button of [next(page), previous(page)])
      expect(await button.boundingBox()).toMatchObject({
        width: 36,
        height: 36,
      });
  }
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("a new month's days appear without fading", async ({ page }) => {
    await page.goto(story("default"));
    await next(page).click();
    const rows = grid(page).getByRole("rowgroup");
    await expect(rows).toHaveCSS("animation-name", "none");
  });
});

test("a new month's days fade in", async ({ page }) => {
  await page.goto(story("default"));
  await next(page).click();
  const rows = grid(page).getByRole("rowgroup");
  await expect(rows).toHaveCSS("animation-name", "fade");
});
