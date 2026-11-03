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

/**
 * Seek the running CSS animation `name` on the element to its midpoint and return
 * the y translation there - or null when that animation does not run.
 */
async function animationMidpointY(element: Locator, name: string) {
  return element.evaluate((node, animationName) => {
    const animation = node
      .getAnimations()
      .find(
        (candidate) =>
          candidate instanceof CSSAnimation &&
          candidate.animationName === animationName,
      );
    if (!animation) return null;
    animation.pause();
    animation.currentTime = Number(animation.effect!.getTiming().duration) / 2;
    return new DOMMatrixReadOnly(getComputedStyle(node).transform).m42;
  }, name);
}

const platformTrigger = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: "Online lernen" });
const platformPopover = (page: Page) =>
  page.getByRole("dialog", { name: "Online lernen" });

test.describe("the navbar popover", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("rises in", async ({ page }) => {
    await page.goto("/");
    await platformTrigger(page).click();
    const y = await animationMidpointY(platformPopover(page), "rise");
    expect(y, "rise animation").not.toBeNull();
    expect(y!).toBeGreaterThan(0);
    expect(y!).toBeLessThan(8);
  });

  test("is inert at once while it falls out", async ({ page }) => {
    await page.goto("/");
    await platformTrigger(page).click();
    await expect(platformPopover(page)).toBeVisible();
    const panel = page.locator("[role='dialog']");
    await page.keyboard.press("Escape");
    await expect(panel).toHaveAttribute("data-state", "closed");
    await expect(panel).toHaveAttribute("inert", "");
    await expect(panel).toHaveCSS("pointer-events", "none");
    await expect(panel).toHaveCSS("animation-name", "fall");
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
