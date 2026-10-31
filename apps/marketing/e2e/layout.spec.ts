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

test("the open mobile menu covers the screen at 1079px", async ({ page }) => {
  await page.setViewportSize({ width: 1079, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menü" }).click();
  expect(
    await page
      .getByRole("banner")
      .evaluate((node) => getComputedStyle(node).position),
  ).toBe("fixed");
});

test("the desktop navigation takes over at 1080px", async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Menü" })).toBeHidden();
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Preise" }),
  ).toBeVisible();
});

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
