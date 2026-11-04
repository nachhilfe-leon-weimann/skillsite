import type { Page } from "@playwright/test";

import { animationsSettled, expect, holdExit, test } from "./fixtures";

const story = (name = "default") =>
  `/iframe.html?id=overlays-popover--${name}&viewMode=story&globals=theme:light`;
const trigger = (page: Page) =>
  page.getByRole("button", { name: "Plattformen", exact: true });
const popover = (page: Page) =>
  page.getByRole("dialog", { name: "Plattformen" });
const closes = (page: Page) => page.getByRole("status");

test("keyboard opens a named non-modal panel that Tab passes through", async ({
  page,
}) => {
  await page.goto(story());
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
  await expect(page.locator("body")).not.toHaveAttribute("data-scroll-locked");
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

test("Shift+Tab returns to the open trigger, then leaves and closes", async ({
  page,
}) => {
  await page.goto(story());
  await trigger(page).focus();
  await page.keyboard.press("Space");
  // The links become focusable once the entrance has begun.
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
  await expect(panel).toHaveCSS("opacity", "1");
  const panelBox = (await panel.boundingBox())!;
  await trigger(page).click();
  await expect(panel).toHaveAttribute("data-state", "closed");
  // Links leave the tab order at once; the panel leaves the accessibility tree.
  await expect(panel.locator("> div")).toHaveAttribute("inert", "");
  await expect(panel).toHaveAttribute("aria-hidden", "true");
  await expect(panel).toHaveCSS("pointer-events", "none");
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
  // Once every entrance and exit has ended, no delayed focus return can still run.
  await animationsSettled(page);
  await expect(after).toBeFocused();
});

test("collision handling keeps the panel inside a 390px viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(story("viewport-edge"));
  await trigger(page).click();
  await expect(popover(page)).toBeVisible();
  await animationsSettled(page);
  const box = (await popover(page).boundingBox())!;
  expect(box.x, "left edge").toBeGreaterThanOrEqual(0);
  expect(box.x + box.width, "right edge").toBeLessThanOrEqual(390);
  expect(box.y, "top edge").toBeGreaterThanOrEqual(0);
  expect(box.y + box.height, "bottom edge").toBeLessThanOrEqual(800);
  await expect(
    popover(page).getByRole("link", { name: /^Termin buchen/ }),
  ).toBeInViewport({ ratio: 1 });
});

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
const hitsPanel = (page: Page, { x, y }: { x: number; y: number }) =>
  page.evaluate(
    ({ x, y }) =>
      !!document
        .elementFromPoint(x, y)
        ?.closest("[data-radix-popper-content-wrapper]"),
    { x, y },
  );

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
  // From the frame it has faded out, it takes no hits.
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

/**
 * Opens the hover story's panel by pointer and moves focus onto its first link;
 * the pointer rests on the trigger's centre, which it returns.
 */
async function hoverOpenWithFocusInside(page: Page) {
  await page.goto(story("hover-exit"));
  const box = (await trigger(page).boundingBox())!;
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(centre.x, centre.y);
  await expect(popover(page)).toBeVisible();
  await trigger(page).focus();
  await page.keyboard.press("Tab");
  await expect(popover(page).getByRole("link").first()).toBeFocused();
  return centre;
}

const focusOnBody = (page: Page) =>
  page.evaluate(() => document.activeElement === document.body);

test("a hover close with focus inside returns focus to the trigger, also across a reopen during the exit", async ({
  page,
}) => {
  const centre = await hoverOpenWithFocusInside(page);

  // The pointer leaves with focus inside; the closed panel drops that focus.
  const release = await holdExit(page);
  await page.mouse.move(10, 10);
  const panel = page.locator("[role='dialog']");
  await expect(panel).toHaveAttribute("data-state", "closed");
  await expect.poll(() => focusOnBody(page)).toBe(true);
  // Back onto the trigger while the exit is held: it reopens, moving no focus.
  await page.mouse.move(centre.x, centre.y);
  await expect(panel).toHaveAttribute("data-state", "open");
  await release();
  expect(await focusOnBody(page), "a reopen moves no focus").toBe(true);

  // The next leave closes it; after the exit, focus is back on the trigger.
  await page.mouse.move(10, 10);
  await expect(panel).toHaveCount(0);
  await expect(trigger(page)).toBeFocused();
});

test("an outside press during a hover exit cancels the focus return, also across a reopen", async ({
  page,
}) => {
  const centre = await hoverOpenWithFocusInside(page);

  // Leave with focus inside, then press outside while the exit is held.
  const release = await holdExit(page);
  await page.mouse.move(10, 10);
  const panel = page.locator("[role='dialog']");
  await expect(panel).toHaveAttribute("data-state", "closed");
  await page.mouse.down();
  await page.mouse.up();
  // Reopen during the exit, then leave again and let the panel unmount.
  await page.mouse.move(centre.x, centre.y);
  await expect(panel).toHaveAttribute("data-state", "open");
  await release();
  await page.mouse.move(10, 10);
  await expect(panel).toHaveCount(0);
  // Radix moves the close focus in a task after the unmount; two frames on, it has.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(await focusOnBody(page), "focus stays off the trigger").toBe(true);
});
