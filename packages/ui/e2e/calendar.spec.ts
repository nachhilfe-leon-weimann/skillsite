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

/** A visible keyboard focus ring: the element matches :focus-visible and draws an outline. */
async function expectRing(element: Locator, kind: string) {
  await expect(element).toBeFocused();
  expect(
    await element.evaluate((node) => node.matches(":focus-visible")),
    `${kind}: focus-visible`,
  ).toBe(true);
  await expect(element, `${kind}: outline`).not.toHaveCSS(
    "outline-style",
    "none",
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
    await expectRing(selected, "selected day");
    await expect(tabStops(page)).toHaveCount(1);

    await page.keyboard.press("ArrowRight");
    const unavailable = day(page, "Freitag, 6. November 2026");
    await expectRing(unavailable, "unavailable day");
    await expect(unavailable).toHaveAttribute("aria-disabled", "true");
    await expect(unavailable).not.toHaveAttribute("disabled");

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    const free = day(page, "Dienstag, 10. November 2026");
    await expectRing(free, "free day");
    await expect(free).not.toHaveAttribute("aria-disabled");

    await page.keyboard.press("Tab");
    await expect(after(page)).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expectRing(free, "free day, back from Tab");
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

test("loading: the grid is busy and no day can be picked", async ({ page }) => {
  await page.goto(story("loading"));
  await expect(grid(page)).toHaveAttribute("aria-busy", "true");
  await expect(tabStops(page)).toHaveCount(1);
  const free = day(page, "Dienstag, 10. November 2026");
  await expect(free).toHaveAttribute("aria-disabled", "true");
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
