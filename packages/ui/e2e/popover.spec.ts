import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const story = (name = "default", theme = "light") =>
  `/iframe.html?id=overlays-popover--${name}&viewMode=story&globals=theme:${theme}`;
const trigger = (page: Page) =>
  page.getByRole("button", { name: "Plattformen", exact: true });
const popover = (page: Page) =>
  page.getByRole("dialog", { name: "Plattformen" });
const closes = (page: Page) => page.getByRole("status");

for (const theme of ["light", "dark"]) {
  test(`keyboard opens a named non-modal panel that Tab passes through in ${theme}`, async ({
    page,
  }) => {
    await page.goto(story("default", theme));
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await expect(popover(page)).toBeVisible();
    await expect(trigger(page)).toBeFocused();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    await expect(trigger(page)).toHaveAttribute(
      "aria-controls",
      (await popover(page).getAttribute("id"))!,
    );
    await expect(popover(page)).not.toHaveAttribute("aria-modal");
    const card = popover(page).locator("> div");
    await expect(card).toHaveCSS("border-radius", "20px");
    await expect(card).toHaveCSS("padding", "8px");
    await expect(card).toHaveCSS("width", "256px");
    await expect(page.locator("body")).not.toHaveAttribute(
      "data-scroll-locked",
    );
    await expect(
      page.locator("[inert], body > [aria-hidden='true']"),
    ).toHaveCount(0);
    const links = popover(page).getByRole("link");
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Tab");
      await expect(links.nth(i)).toBeFocused();
    }
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Danach" })).toBeFocused();
    await expect(popover(page)).toHaveCount(0);
    await expect(closes(page)).toHaveText("Schließereignisse: 1");
  });
}

test("Shift+Tab returns to the open trigger, then leaves and closes", async ({
  page,
}) => {
  await page.goto(story());
  await trigger(page).focus();
  await page.keyboard.press("Space");
  // As on main, the links become focusable once the entrance has begun.
  await expect(popover(page)).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(trigger(page)).toBeFocused();
  await expect(popover(page)).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Davor" })).toBeFocused();
  await expect(popover(page)).toHaveCount(0);
});

test("Escape closes once and focuses the trigger", async ({ page }) => {
  await page.goto(story());
  await trigger(page).focus();
  await page.keyboard.press("Enter");
  await expect(popover(page)).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  await expect(trigger(page)).toBeFocused();
  await expect(popover(page)).toHaveCount(0);
  await expect(closes(page)).toHaveText("Schließereignisse: 1");
});

test("an outside click closes once and keeps the clicked control's focus", async ({
  page,
}) => {
  await page.goto(story());
  await trigger(page).click();
  await expect(popover(page)).toBeVisible();
  await expect(trigger(page)).toBeFocused();
  // A click inside the panel does not dismiss it.
  const card = (await popover(page).locator("> div").boundingBox())!;
  await page.mouse.click(card.x + 3, card.y + 3);
  await expect(popover(page)).toBeVisible();
  const outside = page.getByRole("button", { name: "Außerhalb" });
  await outside.click();
  await expect(popover(page)).toHaveCount(0);
  await expect(outside).toBeFocused();
  await expect(closes(page)).toHaveText("Schließereignisse: 1");
});

test("the trigger toggles; the exit is inert at once and focus stays put", async ({
  page,
}) => {
  await page.goto(story());
  await trigger(page).click();
  const panel = page.locator("[role='dialog']");
  const transitions = () =>
    panel.evaluate((node) =>
      node
        .getAnimations()
        .filter((animation) => animation instanceof CSSTransition)
        .map((animation) => (animation as CSSTransition).transitionProperty)
        .sort(),
    );
  expect(await transitions()).toEqual(["opacity", "translate", "visibility"]);
  await expect(panel).toHaveCSS("opacity", "1");
  const panelBox = (await panel.boundingBox())!;
  await trigger(page).click();
  await expect(panel).toHaveAttribute("data-state", "closed");
  // Links leave the tab order at once; the panel leaves the accessibility tree.
  await expect(panel.locator("> div")).toHaveAttribute("inert", "");
  await expect(panel).toHaveAttribute("aria-hidden", "true");
  await expect(panel).toHaveCSS("pointer-events", "none");
  await expect(panel).toHaveCSS("animation-name", "presence-hold");
  expect(await transitions()).toEqual(["opacity", "translate", "visibility"]);
  // Neither the fading panel nor its positioning wrapper catches a pointer hit.
  const hit = await page.evaluate(
    ({ x, y }) =>
      !!document
        .elementFromPoint(x, y)
        ?.closest("[data-radix-popper-content-wrapper]"),
    {
      x: panelBox.x + panelBox.width / 2,
      y: panelBox.y + panelBox.height / 2,
    },
  );
  expect(hit).toBe(false);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(panel).toHaveCount(0);
  await expect(trigger(page)).toBeFocused();
});

test("a link inside closes the panel and returns focus from the inert panel", async ({
  page,
}) => {
  await page.goto(story());
  await trigger(page).focus();
  await page.keyboard.press("Enter");
  await expect(popover(page)).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#Discord$/);
  await expect(page.locator("[role='dialog']")).toHaveCount(0);
  await expect(trigger(page)).toBeFocused();
});

test("rapid open-close-open leaves one live panel without a delayed focus steal", async ({
  page,
}) => {
  await page.goto(story());
  await trigger(page).focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  const panel = page.locator("[role='dialog']");
  await expect(panel).toHaveCount(1);
  await expect(panel).toHaveAttribute("data-state", "open");
  await expect(panel.locator("> div")).not.toHaveAttribute("inert");
  const after = page.getByRole("button", { name: "Danach" });
  await after.focus();
  await page.waitForTimeout(400);
  await expect(after).toBeFocused();
});

test("reduced motion opens and closes without animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(story());
  for (let cycle = 0; cycle < 3; cycle++) {
    await trigger(page).click();
    await expect(popover(page)).toHaveCSS("animation-name", "none");
    await expect(popover(page)).toHaveCSS("opacity", "1");
    await page.keyboard.press("Escape");
    await expect(page.locator("[role='dialog']")).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
  }
});

for (const width of [390, 1280]) {
  test(`collision handling keeps the panel inside a ${width}px viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(story("viewport-edge"));
    await trigger(page).click();
    await popover(page).evaluate((node) =>
      Promise.all(node.getAnimations().map((animation) => animation.finished)),
    );
    const anchor = (await trigger(page).boundingBox())!;
    const box = (await popover(page).boundingBox())!;
    expect(anchor.x).toBe(0);
    expect(box.x).toBe(0);
    expect(box.width).toBe(256);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    // Floating UI rounds the position to device pixels (under 0.5px here).
    expect(box.y).toBeCloseTo(anchor.y + anchor.height, 0);
  });
}

/**
 * Play the panel's transitions and presence hold at a tenth of their speed, so
 * input timing cannot outrun them.
 */
const slowMotion = (page: Page) =>
  page.evaluate(() => {
    const tick = () => {
      const panel = document.querySelector(
        "[data-radix-popper-content-wrapper] > *",
      );
      for (const animation of panel?.getAnimations() ?? [])
        if (animation.playbackRate !== 0.1) animation.updatePlaybackRate(0.1);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
/** Wait until the panel's opacity passes `limit` in the given direction. */
const panelOpacity = (
  page: Page,
  direction: "above" | "below",
  limit: number,
) =>
  page.waitForFunction(
    ([direction, limit]) => {
      const panel = document.querySelector(
        "[data-radix-popper-content-wrapper] > *",
      );
      if (!panel) return false;
      const opacity = Number(getComputedStyle(panel).opacity);
      return direction === "above" ? opacity >= limit : opacity <= limit;
    },
    [direction, limit] as const,
    { timeout: 10_000 },
  );
const hitsPanel = (page: Page, { x, y }: { x: number; y: number }) =>
  page.evaluate(
    ({ x, y }) =>
      !!document
        .elementFromPoint(x, y)
        ?.closest("[data-radix-popper-content-wrapper]"),
    { x, y },
  );

test("with hitTestableExit the fading panel turns around under the pointer", async ({
  page,
}) => {
  await page.goto(story("hover-exit"));
  await slowMotion(page);
  const box = (await trigger(page).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await panelOpacity(page, "above", 0.99);
  const link = (await popover(page)
    .getByRole("link", { name: /^Termin buchen/ })
    .boundingBox())!;
  const centre = { x: link.x + link.width / 2, y: link.y + link.height / 2 };
  await page.mouse.move(10, 10);
  const panel = page.locator("[role='dialog']");
  await expect(panel).toHaveAttribute("data-state", "closed");
  await panelOpacity(page, "below", 0.7);
  // Fading but visible: its links are inert, its area still takes the pointer.
  await expect(panel.locator("> div")).toHaveAttribute("inert", "");
  await expect(panel).toHaveCSS("pointer-events", "auto");
  expect(await hitsPanel(page, centre)).toBe(true);
  await page.mouse.move(centre.x, centre.y);
  await expect(panel).toHaveAttribute("data-state", "open");
  await expect(panel.locator("> div")).not.toHaveAttribute("inert");
  await panelOpacity(page, "above", 0.99);
});

test("with hitTestableExit a panel faded out after a short hover takes no hits", async ({
  page,
}) => {
  await page.goto(story("hover-exit"));
  const box = (await trigger(page).boundingBox())!;
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(centre.x, centre.y);
  const panelBox = (await popover(page).boundingBox())!;
  const area = {
    x: panelBox.x + panelBox.width / 2,
    y: panelBox.y + panelBox.height / 2,
  };
  await page.mouse.move(10, 10);
  const panel = page.locator("[role='dialog']");
  await expect(panel).toHaveCount(0);
  await slowMotion(page);
  // A hover of about one frame: the reversed exit ends long before the hold.
  await page.mouse.move(centre.x, centre.y);
  await expect(panel).toHaveAttribute("data-state", "open");
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(resolve)),
  );
  await page.mouse.move(10, 10);
  await expect(panel).toHaveAttribute("data-state", "closed");
  // From the frame it has faded out, as on main, it takes no hits.
  const faded = await page.waitForFunction(
    ({ x, y }) => {
      const node = document.querySelector(
        "[data-radix-popper-content-wrapper] > *",
      );
      if (!node || getComputedStyle(node).opacity !== "0") return undefined;
      return {
        hit: !!document
          .elementFromPoint(x, y)
          ?.closest("[data-radix-popper-content-wrapper]"),
      };
    },
    area,
    { timeout: 10_000 },
  );
  expect(await faded.jsonValue()).toEqual({ hit: false });
  // Presence still holds it; it turns hidden and unmounts without reviving.
  await expect(panel).toHaveCount(1);
  await expect(panel).toHaveCSS("visibility", "hidden");
  expect(await hitsPanel(page, area)).toBe(false);
  await page.mouse.move(area.x, area.y);
  await expect(panel).toHaveCount(0, { timeout: 10_000 });
});
