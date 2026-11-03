import { expect, test, type Locator, type Page } from "@playwright/test";

import { isolate, stubAvailability } from "./helpers";

type Motion = "translate" | "scale";

/**
 * Seek the running CSS transition of `property` on the element to its midpoint and
 * return the computed value there - or null when no transition runs for it.
 * A jumping property has no transition, so this separates "animates" from "jumps"
 * independently of timing.
 */
async function midpoint(element: Locator, property: Motion) {
  return element.evaluate((node, name) => {
    const transition = node
      .getAnimations()
      .find(
        (animation) =>
          animation instanceof CSSTransition &&
          animation.transitionProperty === name,
      );
    if (!transition) return null;
    transition.pause();
    transition.currentTime =
      Number(transition.effect!.getTiming().duration) / 2;
    return getComputedStyle(node).getPropertyValue(name);
  }, property);
}

/** The y component of a computed `translate` value ("0px -1.37px" -> -1.37, "none" -> 0). */
function translateY(value: string) {
  if (value === "none") return 0;
  const [, y = "0px"] = value.split(" ");
  return Number.parseFloat(y);
}

test.beforeEach(async ({ page }) => {
  await isolate(page);
  await stubAvailability(page);
});

test("the duration select panel slides and scales in", async ({ page }) => {
  await page.goto("/termin");
  await page.locator('button[aria-haspopup="listbox"]').click();
  const panel = page.getByRole("listbox");
  const y = await midpoint(panel, "translate");
  const scale = await midpoint(panel, "scale");
  expect(y, "translate transition").not.toBeNull();
  expect(translateY(y!)).toBeGreaterThan(-4);
  expect(translateY(y!)).toBeLessThan(0);
  expect(scale, "scale transition").not.toBeNull();
  expect(Number(scale)).toBeGreaterThan(0.97);
  expect(Number(scale)).toBeLessThan(1);
});

test("an FAQ answer slides in", async ({ page }) => {
  await page.goto("/preise");
  const trigger = page.locator("main h3 > button[aria-controls]").first();
  await trigger.click();
  const panelId = await trigger.getAttribute("aria-controls");
  const answer = page.locator(`[id="${panelId}"] > div`);
  const y = await midpoint(answer, "translate");
  expect(y, "translate transition").not.toBeNull();
  expect(translateY(y!)).toBeGreaterThan(-4);
  expect(translateY(y!)).toBeLessThan(0);
});

type Sample = { open: boolean; opacity: number; y: number };

/**
 * Sample the navbar panel's opacity and y translation every frame, with its
 * open state, while `run` plays.
 */
async function samplePanel(page: Page, run: () => Promise<void>) {
  await page.evaluate(() => {
    const samples: Sample[] = [];
    Object.assign(window, { panelSamples: samples });
    const tick = () => {
      const panel = document.querySelector<HTMLElement>("[role='dialog']");
      if (panel) {
        const style = getComputedStyle(panel);
        const [, y = "0px"] =
          style.translate === "none" ? [] : style.translate.split(" ");
        // Count both the translate property and a transform, so any motion shows.
        const matrix = new DOMMatrixReadOnly(
          style.transform === "none" ? undefined : style.transform,
        );
        samples.push({
          open: panel.dataset.state === "open",
          opacity: Number(style.opacity),
          y: Number.parseFloat(y) + matrix.m42,
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await run();
  return page.evaluate(
    () => (window as unknown as { panelSamples: Sample[] }).panelSamples,
  );
}

/**
 * Frames that move against the current direction: opening only ever fades in and
 * rises, closing only fades out and sinks. The first frame after a state change
 * may still show the previous direction (it was computed before the change).
 */
function reversals(samples: Sample[]) {
  return samples.filter((sample, i) => {
    const previous = samples[i - 1];
    if (!previous || previous.open !== sample.open) return false;
    return sample.open
      ? sample.opacity < previous.opacity - 0.01 || sample.y > previous.y + 0.05
      : sample.opacity > previous.opacity + 0.01 ||
          sample.y < previous.y - 0.05;
  });
}

const platformTrigger = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: "Online lernen" });
const platformPopover = (page: Page) =>
  page.getByRole("dialog", { name: "Online lernen" });

test.describe("the navbar popover", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("slides in", async ({ page }) => {
    await page.goto("/");
    await platformTrigger(page).click();
    const y = await midpoint(platformPopover(page), "translate");
    expect(y, "translate transition").not.toBeNull();
    expect(translateY(y!)).toBeGreaterThan(0);
    expect(translateY(y!)).toBeLessThan(8);
  });

  // The panel's look on main: reversible transitions, so a pointer sweeping
  // across the trigger never flashes the panel at full opacity.
  test("a hover shorter than the entrance turns around without a jump", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const box = (await platformTrigger(page).boundingBox())!;
    const y = box.y + box.height / 2;
    const samples = await samplePanel(page, async () => {
      await page.mouse.move(box.x + box.width / 2, y);
      await page.waitForTimeout(60);
      await page.mouse.move(640, 500);
      await page.waitForTimeout(60);
      await page.mouse.move(box.x + box.width / 2, y);
      await page.waitForTimeout(80);
      // A sweep across the trigger, Kontakt to the call to action.
      await page.mouse.move(box.x - 150, y);
      await page.mouse.move(box.x + box.width + 150, y, { steps: 12 });
      await page.waitForTimeout(400);
    });
    expect(samples.some((sample) => !sample.open)).toBe(true);
    expect(reversals(samples)).toEqual([]);
    // It never finished an entrance, so it never reached full opacity.
    expect(Math.max(...samples.map((sample) => sample.opacity))).toBeLessThan(
      0.95,
    );
    await expect(page.locator("[role='dialog']")).toHaveCount(0);
  });

  test("reopening during the exit turns around and completes", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const box = (await platformTrigger(page).boundingBox())!;
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const samples = await samplePanel(page, async () => {
      await page.mouse.move(centre.x, centre.y);
      await page.waitForTimeout(300);
      await page.mouse.move(640, 500);
      await page.waitForTimeout(80);
      await page.mouse.move(centre.x, centre.y);
      await page.waitForTimeout(400);
    });
    expect(reversals(samples)).toEqual([]);
    const reopened = samples.findLastIndex((sample) => !sample.open) + 1;
    expect(reopened).toBeGreaterThan(0);
    // The reopen starts from the faded value, not from scratch.
    expect(samples[reopened]!.opacity).toBeGreaterThan(0.05);
    expect(samples.at(-1)).toEqual({ open: true, opacity: 1, y: 0 });
  });

  test("is inert at once while it falls out", async ({ page }) => {
    await page.goto("/");
    await platformTrigger(page).click();
    await expect(platformPopover(page)).toHaveCSS("opacity", "1");
    const panel = page.locator("[role='dialog']");
    await page.keyboard.press("Escape");
    // The panel sinks back over the same 8px it rose.
    const y = await midpoint(panel, "translate");
    expect(y, "translate transition").not.toBeNull();
    expect(translateY(y!)).toBeGreaterThan(0);
    expect(translateY(y!)).toBeLessThan(8);
    await expect(panel).toHaveAttribute("data-state", "closed");
    await expect(panel).toHaveAttribute("inert", "");
    await expect(panel).toHaveCSS("pointer-events", "none");
    await expect(panel).toHaveCSS("animation-name", "presence-hold");
    await expect(panel).toHaveCount(0);
  });

  test("reopening during the exit leaves one live panel", async ({ page }) => {
    await page.goto("/");
    const trigger = platformTrigger(page);
    await trigger.focus();
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter");
    }
    await page.keyboard.press("Enter");
    const panel = page.locator("[role='dialog']");
    await expect(panel).toHaveCount(1);
    await expect(panel).toHaveAttribute("data-state", "open");
    await expect(panel).not.toHaveAttribute("inert");
    await page.waitForTimeout(400);
    await expect(trigger).toBeFocused();
    await expect(panel).toHaveCSS("opacity", "1");
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the select panel is at its end state at once", async ({ page }) => {
    await page.goto("/termin");
    await page.locator('button[aria-haspopup="listbox"]').click();
    const panel = page.getByRole("listbox");
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(resolve)),
    );
    expect(await panel.evaluate((node) => getComputedStyle(node).opacity)).toBe(
      "1",
    );
    expect(
      translateY(
        await panel.evaluate((node) => getComputedStyle(node).translate),
      ),
    ).toBe(0);
  });

  test("the navbar popover appears and goes at once", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await platformTrigger(page).click();
    const panel = platformPopover(page);
    await expect(panel).toHaveCSS("animation-name", "none");
    await expect(panel).toHaveCSS("opacity", "1");
    await page.keyboard.press("Escape");
    await expect(page.locator("[role='dialog']")).toHaveCount(0);
    await expect(platformTrigger(page)).toBeFocused();
  });
});
