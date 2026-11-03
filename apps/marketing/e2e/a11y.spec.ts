import { expect, test, type Page } from "@playwright/test";

import { isolate, stubAvailability } from "./helpers";
import { indexablePaths } from "../src/lib/routes";

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

test.describe("the desktop platform popover", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  const trigger = (page: Page) =>
    page.getByRole("banner").getByRole("button", { name: "Online lernen" });
  const popover = (page: Page) =>
    page.getByRole("dialog", { name: "Online lernen" });

  test("is a named, non-modal dialog of ordinary links", async ({ page }) => {
    await page.goto("/");
    // Radix's modal mode would hide every other child of <body>.
    const hiddenRoots = () =>
      page
        .locator("body > [aria-hidden='true']")
        .evaluateAll((nodes) => nodes.map((node) => node.outerHTML));
    const hiddenBefore = await hiddenRoots();
    await expect(trigger(page)).toHaveAttribute("aria-haspopup", "dialog");
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await trigger(page).click();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    const panelId = await trigger(page).getAttribute("aria-controls");
    await expect(popover(page)).toHaveAttribute("id", panelId!);
    await expect(popover(page)).not.toHaveAttribute("aria-modal");
    await expect(popover(page).getByRole("link")).toHaveText([
      /^Discord/,
      /^Microsoft Teams/,
      /^Termin buchen/,
    ]);
    await expect(popover(page).getByRole("menuitem")).toHaveCount(0);
    // Non-modal: the page stays reachable, nothing is hidden, locked or inert.
    expect(await hiddenRoots()).toEqual(hiddenBefore);
    await expect(page.locator("[inert]")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveAttribute(
      "data-scroll-locked",
    );
    await expect(page.locator("body")).toHaveCSS("overflow", "visible");
    await expect(page.locator("body")).toHaveCSS("pointer-events", "auto");
    await expect(page.getByRole("main")).toBeVisible();
  });

  for (const key of ["Enter", "Space"]) {
    test(`${key} opens it; Tab passes through and leaves without a trap`, async ({
      page,
    }) => {
      await page.goto("/");
      await trigger(page).focus();
      await page.keyboard.press(key);
      await expect(popover(page)).toBeVisible();
      await expect(trigger(page)).toBeFocused();
      const links = popover(page).getByRole("link");
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press("Tab");
        await expect(links.nth(i)).toBeFocused();
      }
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(trigger(page)).toBeFocused();
      await expect(popover(page)).toBeVisible();
      for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
      await expect(
        page.getByRole("banner").getByRole("link", { name: /Erstgespräch/ }),
      ).toBeFocused();
      await expect(popover(page)).toHaveCount(0);
      await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    });
  }

  test("Shift+Tab from the trigger leaves and closes it", async ({ page }) => {
    await page.goto("/");
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await expect(popover(page)).toBeVisible();
    await page.keyboard.press("Shift+Tab");
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Kontakt" }),
    ).toBeFocused();
    await expect(popover(page)).toHaveCount(0);
  });

  test("Escape closes it and focuses its trigger", async ({ page }) => {
    await page.goto("/");
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(popover(page).getByRole("link").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(trigger(page)).toBeFocused();
    await expect(popover(page)).toHaveCount(0);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    // Escape with focus on the trigger closes it as well.
    await page.keyboard.press("Enter");
    await expect(popover(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popover(page)).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
  });

  test("an outside click closes it and keeps the clicked target's focus", async ({
    page,
  }) => {
    await page.goto("/preise");
    await trigger(page).click();
    // A click pins it open after the pointer leaves.
    await page.mouse.move(640, 600);
    await expect(popover(page)).toBeVisible();
    const outside = page.locator("main h3 > button[aria-controls]").first();
    await outside.click();
    await expect(popover(page)).toHaveCount(0);
    await expect(outside).toBeFocused();
    await expect(outside).toHaveAttribute("aria-expanded", "true");
  });

  test("hover opens it without moving focus; the pointer crosses to the panel", async ({
    page,
  }) => {
    await page.goto("/");
    const home = page
      .getByRole("banner")
      .getByRole("link", { name: "Startseite" });
    await home.focus();
    const box = (await trigger(page).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(popover(page)).toBeVisible();
    await expect(home).toBeFocused();
    // Down through the gap below the trigger onto the last link.
    const last = (await popover(page).getByRole("link").last().boundingBox())!;
    await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2, {
      steps: 12,
    });
    await expect(popover(page)).toBeVisible();
    await expect(home).toBeFocused();
    await page.mouse.move(box.x - 200, 600, { steps: 4 });
    await expect(popover(page)).toHaveCount(0);
    await expect(home).toBeFocused();
  });

  test("after Escape a hovered trigger stays closed until the pointer leaves or the trigger is used", async ({
    page,
  }) => {
    await page.goto("/");
    const box = (await trigger(page).boundingBox())!;
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await page.mouse.move(centre.x, centre.y);
    await expect(popover(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popover(page)).toHaveCount(0);
    await page.mouse.move(centre.x + 6, centre.y + 2, { steps: 3 });
    await page.waitForTimeout(400);
    await expect(popover(page)).toHaveCount(0);
    // A click is a deliberate reopen.
    await page.mouse.click(centre.x, centre.y);
    await expect(popover(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popover(page)).toHaveCount(0);
    // So is a fresh hover after the pointer left.
    await page.mouse.move(centre.x, 400, { steps: 3 });
    await page.mouse.move(centre.x, centre.y, { steps: 3 });
    await expect(popover(page)).toBeVisible();
  });

  test("a click on the open trigger closes it, and hover does not reopen it", async ({
    page,
  }) => {
    await page.goto("/");
    await trigger(page).click();
    await expect(popover(page)).toBeVisible();
    await trigger(page).click();
    await expect(popover(page)).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
    await page.waitForTimeout(400);
    await expect(popover(page)).toHaveCount(0);
  });

  test("rapid toggling settles on one consistent panel", async ({ page }) => {
    await page.goto("/");
    await trigger(page).focus();
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Enter");
      await page.keyboard.press("Escape");
    }
    await page.keyboard.press("Enter");
    await expect(popover(page)).toBeVisible();
    await expect(page.locator("[role='dialog']")).toHaveCount(1);
    await expect(page.locator("[inert]")).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("[role='dialog']")).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
  });

  test("a link navigates on the client and closes it", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() =>
      Object.assign(window, { navigationMarker: true }),
    );
    await trigger(page).click();
    await popover(page)
      .getByRole("link", { name: /^Termin buchen/ })
      .click();
    await expect(page).toHaveURL(/\/termin$/);
    await expect(popover(page)).toHaveCount(0);
    expect(await page.evaluate(() => "navigationMarker" in window)).toBe(true);
    await trigger(page).click();
    await expect(
      popover(page).getByRole("link", { name: /^Termin buchen/ }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("a section link jumps on the page, closes it and is never current", async ({
    page,
  }) => {
    await page.goto("/online-lernen");
    await page.evaluate(() =>
      Object.assign(window, { navigationMarker: true }),
    );
    await trigger(page).click();
    const links = popover(page).getByRole("link");
    await expect(links.first()).toHaveAttribute("aria-current", "page");
    await expect(links.nth(1)).not.toHaveAttribute("aria-current");
    await links.nth(1).click();
    await expect(page).toHaveURL(/\/online-lernen#ms-teams$/);
    await expect(popover(page)).toHaveCount(0);
    expect(await page.evaluate(() => "navigationMarker" in window)).toBe(true);
  });
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

for (const path of indexablePaths) {
  test(`the heading outline of ${path} never skips a level`, async ({
    page,
  }) => {
    await page.goto(path);
    const levels = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .evaluateAll((headings) =>
        headings.map((heading) => Number(heading.tagName.slice(1))),
      );
    expect(levels[0], "the first heading is the h1").toBe(1);
    levels.forEach((level, i) => {
      if (i > 0)
        expect(
          level,
          `heading ${i + 1} of ${levels.length}`,
        ).toBeLessThanOrEqual(levels[i - 1]! + 1);
    });
  });
}
