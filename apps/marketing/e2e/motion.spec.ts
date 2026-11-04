import { expect, test, type Locator, type Page } from "@playwright/test";

import { isolate, stubAvailability } from "./helpers";
import { primaryCta } from "../src/content/site";

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

/** The duration select's trigger on /termin (hidden from AT while its list is open). */
async function durationSelect(page: Page) {
  await expect(
    page.getByRole("combobox", { name: "Dauer", exact: true }),
  ).toBeVisible();
  return page.locator("[role=combobox]");
}

test("the duration select panel slides and scales in", async ({ page }) => {
  await page.goto("/termin");
  await (await durationSelect(page)).click();
  const panel = page.getByRole("listbox", { name: "Dauer" });
  // The entrance starts on the frame the panel is placed: wait for it.
  await expect.poll(() => midpoint(panel, "translate")).not.toBeNull();
  const y = await midpoint(panel, "translate");
  const scale = await midpoint(panel, "scale");
  expect(translateY(y!)).toBeGreaterThan(-4);
  expect(translateY(y!)).toBeLessThan(0);
  expect(scale, "scale transition").not.toBeNull();
  expect(Number(scale)).toBeGreaterThan(0.97);
  expect(Number(scale)).toBeLessThan(1);
});

test("the duration select panel slides and scales out", async ({ page }) => {
  await page.goto("/termin");
  const trigger = await durationSelect(page);
  await trigger.click();
  const list = page.getByRole("listbox", { name: "Dauer" });
  await expect(list).toHaveCSS("opacity", "1");
  // The closing panel unmounts once its exit ends, so sample its midpoint in
  // the page, on the first frame its exit transitions run.
  await page.evaluate(() => {
    const tick = () => {
      const node = document.querySelector<HTMLElement>(
        "[data-radix-popper-content-wrapper] > [data-state=closed]",
      );
      const running = (node?.getAnimations() ?? []).filter(
        (animation): animation is CSSTransition =>
          animation instanceof CSSTransition,
      );
      const names = running.map((animation) => animation.transitionProperty);
      if (!node || !names.includes("translate") || !names.includes("scale")) {
        requestAnimationFrame(tick);
        return;
      }
      for (const animation of running) {
        animation.pause();
        animation.currentTime =
          Number(animation.effect!.getTiming().duration) / 2;
      }
      const style = getComputedStyle(node);
      Object.assign(window, {
        exitMidpoint: { translate: style.translate, scale: style.scale },
      });
    };
    requestAnimationFrame(tick);
  });
  await page.keyboard.press("Escape");
  const sample = () =>
    page.evaluate(
      () =>
        (
          window as unknown as {
            exitMidpoint?: { translate: string; scale: string };
          }
        ).exitMidpoint ?? null,
    );
  await expect.poll(sample).not.toBeNull();
  const { translate, scale } = (await sample())!;
  expect(translateY(translate)).toBeGreaterThan(-4);
  expect(translateY(translate)).toBeLessThan(0);
  expect(Number(scale)).toBeGreaterThan(0.97);
  expect(Number(scale)).toBeLessThan(1);
  await expect(trigger).toBeFocused();
  await expect(page.locator("[data-radix-popper-content-wrapper]")).toHaveCount(
    0,
  );
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

/** Playback rate for the navbar panel's motion in the pointer-path tests. */
const SLOW_MOTION = 0.1;

/**
 * Sample the navbar panel's opacity and y translation every frame, with its
 * open state, while `run` plays. Its transitions and presence hold run at
 * SLOW_MOTION, so input timing cannot outrun them under CI load.
 */
async function samplePanel(page: Page, run: () => Promise<void>) {
  await page.evaluate((rate) => {
    const samples: Sample[] = [];
    Object.assign(window, { panelSamples: samples });
    const tick = () => {
      const panel = document.querySelector<HTMLElement>(
        "[data-radix-popper-content-wrapper] > *",
      );
      if (panel) {
        for (const animation of panel.getAnimations())
          if (animation.playbackRate !== rate)
            animation.updatePlaybackRate(rate);
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
  }, SLOW_MOTION);
  await run();
  return page.evaluate(
    () => (window as unknown as { panelSamples: Sample[] }).panelSamples,
  );
}

/** Wait until the panel's opacity passes `limit` in the given direction. */
function panelOpacity(page: Page, direction: "above" | "below", limit: number) {
  return page.waitForFunction(
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
}

/**
 * Frames that move against the current direction: opening only ever fades in and
 * rises, closing only fades out and sinks. In slow motion a frame moves far less
 * than the tolerance, while a snap (a jump to full opacity or a restart from
 * zero) moves far more, also on the frame of a state change.
 */
function reversals(samples: Sample[]) {
  return samples.filter((sample, i) => {
    const previous = samples[i - 1];
    if (!previous) return false;
    return sample.open
      ? sample.opacity < previous.opacity - 0.1 || sample.y > previous.y + 0.8
      : sample.opacity > previous.opacity + 0.1 || sample.y < previous.y - 0.8;
  });
}

const panelGone = (page: Page) =>
  expect(page.locator("[role='dialog']")).toHaveCount(0, { timeout: 10_000 });

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

  // The panel's motion on main: reversible transitions, so an interrupted open or
  // close turns around and a sweep across the trigger never flashes the panel.
  test("an interrupted entrance and a sweep turn around without a jump", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const box = (await platformTrigger(page).boundingBox())!;
    const y = box.y + box.height / 2;
    const samples = await samplePanel(page, async () => {
      await page.mouse.move(box.x + box.width / 2, y);
      await panelOpacity(page, "above", 0.2);
      await page.mouse.move(640, 500);
      await panelGone(page);
      // A sweep across the trigger, Kontakt to the call to action.
      await page.mouse.move(box.x - 150, y);
      await page.mouse.move(box.x + box.width + 150, y, { steps: 12 });
      await panelGone(page);
    });
    expect(samples.some((sample) => !sample.open)).toBe(true);
    expect(reversals(samples)).toEqual([]);
    expect(Math.max(...samples.map((sample) => sample.opacity))).toBeLessThan(
      0.9,
    );
  });

  for (const target of ["trigger", "panel"]) {
    test(`pointer re-entry onto the ${target} during the exit turns it around`, async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const box = (await platformTrigger(page).boundingBox())!;
      let link = box;
      const samples = await samplePanel(page, async () => {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await panelOpacity(page, "above", 0.99);
        link = (await platformPopover(page)
          .getByRole("link", { name: /^Termin buchen/ })
          .boundingBox())!;
        await page.mouse.move(640, 500);
        await panelOpacity(page, "below", 0.7);
        const back = target === "trigger" ? box : link;
        await page.mouse.move(
          back.x + back.width / 2,
          back.y + back.height / 2,
        );
        await expect(platformPopover(page)).toHaveAttribute(
          "data-state",
          "open",
        );
        await panelOpacity(page, "above", 0.99);
      });
      expect(reversals(samples)).toEqual([]);
      const reopened = samples.findLastIndex((sample) => !sample.open) + 1;
      expect(reopened).toBeGreaterThan(0);
      // It turns around from the faded value instead of starting from scratch.
      expect(samples[reopened]!.opacity).toBeGreaterThan(0.3);
      if (target === "panel") {
        // As on main, a click on the revived link follows it.
        await page.mouse.click(
          link.x + link.width / 2,
          link.y + link.height / 2,
        );
        await expect(page).toHaveURL(/\/termin$/);
      }
    });
  }

  test("a click under a panel closed by its trigger reaches the page", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await samplePanel(page, async () => {
      await platformTrigger(page).click();
      await panelOpacity(page, "above", 0.99);
      const panel = page.locator("[role='dialog']");
      const panelBox = (await panel.boundingBox())!;
      await page.evaluate(() =>
        document.addEventListener(
          "click",
          (event) => {
            event.preventDefault();
            Object.assign(window, {
              clickedPanel: !!(event.target as Element).closest(
                "[data-radix-popper-content-wrapper]",
              ),
            });
          },
          { capture: true, once: true },
        ),
      );
      await platformTrigger(page).click();
      await expect(panel).toHaveAttribute("data-state", "closed");
      await page.mouse.click(
        panelBox.x + panelBox.width / 2,
        panelBox.y + panelBox.height / 2,
      );
      // Still fading out, not revived by the pointer passing over it.
      await expect(panel).toHaveCount(1);
      await expect(panel).toHaveAttribute("data-state", "closed");
    });
    expect(
      await page.evaluate(
        () => (window as unknown as { clickedPanel?: boolean }).clickedPanel,
      ),
    ).toBe(false);
  });

  // Rule: focus goes back to the trigger after the exit when the panel held focus
  // as it began closing and focus has stayed on <body> since, across reopens.
  test("a hover leave, return and leave with focus inside restores the trigger", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const trigger = platformTrigger(page);
    const box = (await trigger.boundingBox())!;
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await samplePanel(page, async () => {
      await page.mouse.move(centre.x, centre.y);
      await panelOpacity(page, "above", 0.99);
      await trigger.focus();
      await page.keyboard.press("Tab");
      await expect(
        platformPopover(page).getByRole("link").first(),
      ).toBeFocused();
      await page.mouse.move(640, 500);
      await panelOpacity(page, "below", 0.7);
      await page.mouse.move(centre.x, centre.y);
      await expect(platformPopover(page)).toHaveAttribute("data-state", "open");
      // Reopening does not move focus.
      expect(
        await page.evaluate(() => document.activeElement === document.body),
      ).toBe(true);
      await page.mouse.move(640, 500);
      await panelGone(page);
    });
    await expect(trigger).toBeFocused();
  });

  // Main's panel turns hidden when its (shortened) exit transition ends, so a
  // panel that has faded out takes no hits, even while presence still holds it.
  test("a panel faded out after a short hover takes no hits", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const box = (await platformTrigger(page).boundingBox())!;
    await platformTrigger(page).click();
    await expect(platformPopover(page)).toHaveCSS("opacity", "1");
    const panelBox = (await platformPopover(page).boundingBox())!;
    await page.keyboard.press("Escape");
    await panelGone(page);
    await page.mouse.move(640, 500);
    const area = {
      x: panelBox.x + panelBox.width / 2,
      y: panelBox.y + panelBox.height / 2,
    };
    const samples = await samplePanel(page, async () => {
      // A hover of about one frame.
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForFunction(() =>
        document.querySelector(
          "[data-radix-popper-content-wrapper] > [data-state='open']",
        ),
      );
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(resolve)),
      );
      await page.mouse.move(640, 500);
      // Exactly 0 only once the exit transition has ended.
      await page.waitForFunction(() => {
        const panel = document.querySelector(
          "[data-radix-popper-content-wrapper] > *",
        );
        return (
          panel?.getAttribute("data-state") === "closed" &&
          getComputedStyle(panel).opacity === "0"
        );
      });
      await expect(page.locator("[role='dialog']")).toHaveCount(1);
      expect(
        await page.evaluate(
          ({ x, y }) =>
            !!document
              .elementFromPoint(x, y)
              ?.closest("[data-radix-popper-content-wrapper]"),
          area,
        ),
      ).toBe(false);
      // Entering its area does not bring it back: it unmounts.
      await page.mouse.move(area.x, area.y);
      await panelGone(page);
    });
    const closed = samples.findIndex((sample) => !sample.open);
    expect(closed).toBeGreaterThan(0);
    expect(samples.slice(closed).filter((sample) => sample.open)).toEqual([]);
  });

  // An outside click during a hover exit, with focus inside as it began, leaves
  // focus on <body>: also across a reopen and a second leave.
  for (const reopen of [false, true]) {
    test(`a plain-text click during a hover exit keeps focus off the trigger${reopen ? " across a reopen" : ""}`, async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const trigger = platformTrigger(page);
      const box = (await trigger.boundingBox())!;
      const text = (await page
        .getByRole("main")
        .locator("p")
        .first()
        .boundingBox())!;
      const panel = page.locator("[role='dialog']");
      await samplePanel(page, async () => {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await panelOpacity(page, "above", 0.99);
        await trigger.focus();
        await page.keyboard.press("Tab");
        await expect(
          platformPopover(page).getByRole("link").first(),
        ).toBeFocused();
        await page.mouse.move(text.x + 2, text.y + 2);
        await expect(panel).toHaveAttribute("data-state", "closed");
        await page.mouse.down();
        await page.mouse.up();
        // The click landed during the exit.
        await expect(panel).toHaveCount(1);
        if (reopen) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await expect(panel).toHaveAttribute("data-state", "open");
          await page.mouse.move(640, 500);
        }
        await panelGone(page);
      });
      // Two frames after the unmount, the close's focus handling has settled.
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      expect(
        await page.evaluate(() => document.activeElement === document.body),
      ).toBe(true);
    });
  }

  // As on main, a panel closed with the pointer elsewhere stays hit-testable while
  // it fades, so the pointer coming back onto it reopens it.
  for (const close of ["an outside click", "Tab"]) {
    test(`after ${close} with the pointer elsewhere, re-entry onto the fading panel reopens it`, async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const trigger = platformTrigger(page);
      const text = (await page
        .getByRole("main")
        .locator("p")
        .first()
        .boundingBox())!;
      await page.mouse.move(text.x + 2, text.y + 2);
      let link = text;
      const samples = await samplePanel(page, async () => {
        await trigger.focus();
        await page.keyboard.press("Enter");
        await panelOpacity(page, "above", 0.99);
        link = (await platformPopover(page)
          .getByRole("link", { name: /^Termin buchen/ })
          .boundingBox())!;
        const panel = page.locator("[role='dialog']");
        if (close === "Tab") {
          for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
        } else {
          await page.mouse.down();
          await page.mouse.up();
        }
        await expect(panel).toHaveAttribute("data-state", "closed");
        await panelOpacity(page, "below", 0.7);
        await page.mouse.move(
          link.x + link.width / 2,
          link.y + link.height / 2,
        );
        await expect(panel).toHaveAttribute("data-state", "open");
        await panelOpacity(page, "above", 0.99);
      });
      expect(reversals(samples)).toEqual([]);
      const reopened = samples.findLastIndex((sample) => !sample.open) + 1;
      expect(reopened).toBeGreaterThan(0);
      expect(samples[reopened]!.opacity).toBeGreaterThan(0.3);
    });
  }

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
    await expect(panel.locator("> div")).toHaveAttribute("inert", "");
    await expect(panel).toHaveAttribute("aria-hidden", "true");
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
    await expect(panel.locator("> div")).not.toHaveAttribute("inert");
    await page.waitForTimeout(400);
    await expect(trigger).toBeFocused();
    await expect(panel).toHaveCSS("opacity", "1");
  });
});

/** The menu's own motion: the nearest animated ancestor of its "Preise" link. */
const mobileMenuMotion = (page: Page) =>
  page
    .getByRole("dialog", { name: "Menü" })
    .getByRole("link", { name: "Preise" })
    .evaluate((link, ctaHref) => {
      let node = link.parentElement;
      while (node && getComputedStyle(node).animationName === "none")
        node = node.parentElement;
      if (!node) return null;
      const style = getComputedStyle(node);
      return {
        name: style.animationName,
        duration: style.animationDuration,
        easing: style.animationTimingFunction,
        holdsCta: !!node.querySelector(`a[href="${ctaHref}"]`),
        isDialog: node.getAttribute("role") === "dialog",
      };
    }, primaryCta.href);

/** Whether `element` has an animated ancestor inside the dialog (or is animated itself). */
const movesInDialog = (element: Locator) =>
  element.evaluate((node) => {
    for (let n: Element | null = node; n; n = n.parentElement) {
      if (getComputedStyle(n).animationName !== "none") return true;
      if (n.getAttribute("role") === "dialog") return false;
    }
    return false;
  });

/** After one frame: the dialog and its backdrop nodes still in the document. */
const mobileMenuNodes = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number>((resolve) =>
        requestAnimationFrame(() =>
          resolve(document.querySelectorAll("body > [data-state]").length),
        ),
      ),
  );

test.describe("the mobile menu", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("fades its links down under a still header and closes at once", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menü" }).click();
    const menu = page.getByRole("dialog", { name: "Menü" });
    await expect(menu).toBeVisible();
    await expect(menu).toHaveCSS("animation-name", "none");
    await expect(menu).toHaveCSS("transform", "none");
    expect(await mobileMenuMotion(page)).toEqual({
      name: "fade-down",
      duration: "0.16s",
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      holdsCta: true,
      isDialog: false,
    });
    // The header row stays still: neither the home link nor the close control moves.
    expect(
      await movesInDialog(menu.getByRole("link", { name: "Startseite" })),
    ).toBe(false);
    expect(
      await movesInDialog(menu.getByRole("button", { name: "Menü" })),
    ).toBe(false);
    // The modal's backdrop stays invisible: the menu paints its own background.
    const backdrop = page.locator("body > [data-state='open']:not([role])");
    await expect(backdrop).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(backdrop).toHaveCSS("backdrop-filter", "none");
    await expect(backdrop).toHaveCSS("animation-name", "none");
    await menu.getByRole("button", { name: "Menü" }).click();
    expect(await mobileMenuNodes(page)).toBe(0);
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the select panel is at its end state at once", async ({ page }) => {
    await page.goto("/termin");
    const trigger = await durationSelect(page);
    await trigger.click();
    const panel = page.getByRole("listbox", { name: "Dauer" });
    await expect(panel).toHaveCSS("opacity", "1", { timeout: 500 });
    expect(
      translateY(
        await panel.evaluate((node) => getComputedStyle(node).translate),
      ),
    ).toBe(0);
    await page.keyboard.press("Escape");
    await expect(
      page.locator("[data-radix-popper-content-wrapper]"),
    ).toHaveCount(0, { timeout: 500 });
    await expect(trigger).toBeFocused();
  });

  test("the mobile menu appears and goes at once", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Menü" }).click();
    await expect(page.getByRole("dialog", { name: "Menü" })).toBeVisible();
    expect(await mobileMenuMotion(page)).toBeNull();
    await page.keyboard.press("Escape");
    expect(await mobileMenuNodes(page)).toBe(0);
    await expect(page.getByRole("button", { name: "Menü" })).toBeFocused();
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
