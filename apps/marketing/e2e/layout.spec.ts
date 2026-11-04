import { expect, test, type Page } from "@playwright/test";

import { isolate } from "./helpers";

/** Distance between the bottom of the sticky header and the top of the anchor target. */
async function gapBelowHeader(page: Page, id: string) {
  return page.evaluate((targetId) => {
    const header = document.querySelector("header")!.getBoundingClientRect();
    const target = document.getElementById(targetId)!.getBoundingClientRect();
    return target.top - header.bottom;
  }, id);
}

test.beforeEach(async ({ page }) => {
  await isolate(page);
});

for (const width of [390, 1280]) {
  test(`an anchor lands below the header at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/faecher#faq");
    // `html { scroll-behavior: smooth }` animates the browser's own scroll-to-fragment
    // on load, so the gap starts large and shrinks over roughly a second - poll on the
    // bound that is false until it settles, then assert both bounds on the settled value.
    await expect.poll(() => gapBelowHeader(page, "faq")).toBeLessThan(4);
    expect(await gapBelowHeader(page, "faq")).toBeGreaterThanOrEqual(-1);
  });
}

for (const width of [390, 1079]) {
  test(`the open mobile menu covers the screen at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "Menü" }).click();
    // The menu is a portalled dialog now; its header row and links fill it.
    const menu = page.getByRole("dialog", { name: "Menü" });
    expect(await menu.evaluate((node) => getComputedStyle(node).position)).toBe(
      "fixed",
    );
    expect(await menu.boundingBox()).toEqual({
      x: 0,
      y: 0,
      width,
      height: 800,
    });
    const banner = menu.getByRole("banner");
    expect(await banner.boundingBox()).toEqual({
      x: 0,
      y: 0,
      width,
      height: 800,
    });
  });
}

test("the desktop navigation takes over at 1080px", async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Menü" })).toBeHidden();
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Preise" }),
  ).toBeVisible();
});

for (const width of [1080, 1280]) {
  test(`the platform popover hangs right-aligned below its trigger at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const trigger = page
      .getByRole("banner")
      .getByRole("button", { name: "Online lernen" });
    await trigger.click();
    const panel = page.getByRole("dialog", { name: "Online lernen" });
    await expect(panel).toBeVisible();
    await panel.evaluate((node) =>
      Promise.all(node.getAnimations().map((animation) => animation.finished)),
    );
    const anchor = (await trigger.boundingBox())!;
    const box = (await panel.boundingBox())!;
    // The previous absolute panel: right edge on the trigger's, top on its bottom,
    // 16rem wide, with a 6px hover corridor above the card.
    expect(box.width).toBe(256);
    expect(box.x + box.width).toBeCloseTo(anchor.x + anchor.width, 0);
    // Floating UI rounds the position to device pixels (under 0.5px here).
    expect(box.y).toBeCloseTo(anchor.y + anchor.height, 0);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    const card = (await panel.locator("> div").boundingBox())!;
    expect(card.y - box.y).toBeCloseTo(6, 1);
    await expect(panel.locator("> div")).toHaveCSS("border-radius", "20px");
    await expect(panel.locator("> div")).toHaveCSS("padding", "8px");
  });
}

test("enabled buttons show the pointer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");
  const menuButton = page.getByRole("button", { name: "Menü" });
  expect(
    await menuButton.evaluate((node) => getComputedStyle(node).cursor),
  ).toBe("pointer");
});

test("the quote on /ueber-mich has its bottom spacing", async ({ page }) => {
  await page.goto("/ueber-mich");
  const padding = await page
    .locator(".pb-section-sm")
    .first()
    .evaluate((node) => getComputedStyle(node).paddingBottom);
  expect(Number.parseFloat(padding)).toBeGreaterThan(0);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("an anchor jumps below the header at once, without a smooth scroll", async ({
    page,
  }) => {
    await page.goto("/faecher#faq");
    // No poll and no wait: `prefers-reduced-motion` turns off `scroll-behavior:
    // smooth` (theme.css), so the fragment jump is already at rest once `goto`
    // resolves - unlike the animated case above, which needs a second or so.
    const gap = await gapBelowHeader(page, "faq");
    expect(gap).toBeGreaterThanOrEqual(-1);
    expect(gap).toBeLessThan(4);
  });
});
