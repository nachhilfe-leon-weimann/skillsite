import { expect, test } from "@playwright/test";

import { isolate, stubAvailability } from "./helpers";

test.beforeEach(async ({ page }) => {
  await isolate(page);
});

test.describe("at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the theme buttons have names", async ({ page }) => {
    await page.goto("/");
    const group = page.getByRole("group", { name: "Farbschema wählen" });
    await expect(group.getByRole("button", { name: "Hell" })).toBeVisible();
    await expect(group.getByRole("button", { name: "Dunkel" })).toBeVisible();
  });

  test("Escape closes the menu and returns focus to its button", async ({
    page,
  }) => {
    await page.goto("/preise");
    const menuButton = page.getByRole("button", { name: "Menü" });
    await menuButton.click();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(menuButton).toBeFocused();
  });

  test("the mobile menu marks the current page", async ({ page }) => {
    await page.goto("/preise");
    await page.getByRole("button", { name: "Menü" }).click();
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "Preise" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      banner.getByRole("link", { name: "Ablauf" }),
    ).not.toHaveAttribute("aria-current");
  });

  test("a section link is never the current page", async ({ page }) => {
    await page.goto("/online-lernen");
    await page.getByRole("button", { name: "Menü" }).click();
    await page
      .getByRole("banner")
      .getByRole("button", { name: "Online lernen" })
      .click();
    const links = page.locator("#mobile-platform-nav a");
    await expect(links.first()).toHaveAttribute("aria-current", "page");
    await expect(page.locator('#mobile-platform-nav a[href*="#"]')).toHaveCount(
      1,
    );
    await expect(
      page.locator('#mobile-platform-nav a[href*="#"]'),
    ).not.toHaveAttribute("aria-current");
  });
});

test("the desktop navigation marks the current page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/preise");
  const banner = page.getByRole("banner");
  await expect(banner.getByRole("link", { name: "Preise" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("the platform disclosure is a disclosure, not a menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const trigger = page
    .getByRole("banner")
    .getByRole("button", { name: "Online lernen" });
  await expect(trigger).not.toHaveAttribute("aria-haspopup");
  const panelId = await trigger.getAttribute("aria-controls");
  expect(panelId).toBeTruthy();
  await expect(page.locator(`[id="${panelId}"]`)).toHaveCount(1);
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
});

test("the duration select is named", async ({ page }) => {
  await stubAvailability(page);
  await page.goto("/termin");
  await expect(
    page.getByRole("button", { name: /^Dauer: \d+ Minuten$/ }),
  ).toBeVisible();
});

test("the Discord buttons are named by their text only", async ({ page }) => {
  await page.goto("/online-lernen");
  await expect(
    page.getByRole("link", { name: "Server beitreten", exact: true }),
  ).toHaveCount(2);
});
